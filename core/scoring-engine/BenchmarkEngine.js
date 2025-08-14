'use strict';

class BenchmarkEngine {
  constructor(pool) {
    this.pool = pool;
  }

  async calculatePercentileRank(candidateScore, tenantId) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE final_score < $1) * 100.0 / 
        NULLIF(COUNT(*), 0) as percentile
      FROM leads
      WHERE tenant_id = $2
    `;
    const result = await this.pool.query(query, [candidateScore, tenantId]);
    return Math.round((result.rows[0] && result.rows[0].percentile) || 0);
  }

  async getDistribution(tenantId) {
    const query = `
      SELECT 
        WIDTH_BUCKET(final_score, 0, 100, 10) as bucket,
        COUNT(*) as count,
        AVG(final_score) as avg_score
      FROM leads
      WHERE tenant_id = $1
      GROUP BY bucket
      ORDER BY bucket
    `;
    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  async compareToTopPerformers(candidateProfile, tenantId) {
    const query = `
      SELECT 
        responses as profile,
        final_score,
        tier
      FROM leads
      WHERE tenant_id = $1 
      AND final_score >= (
        SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY final_score)
        FROM leads
        WHERE tenant_id = $1
      )
    `;
    const result = await this.pool.query(query, [tenantId]);
    const topPerformers = result.rows;

    const similarities = topPerformers.map(performer => {
      return {
        score: this.calculateSimilarity(candidateProfile, performer.profile || {}),
        performer
      };
    });
    if (similarities.length === 0) {
      return { closestMatch: null, averageSimilarity: 0, insights: [] };
    }
    similarities.sort((a, b) => b.score - a.score);
    return {
      closestMatch: similarities[0],
      averageSimilarity: similarities.reduce((a, b) => a + b.score, 0) / similarities.length,
      insights: this.generateComparisionInsights(candidateProfile, similarities)
    };
  }

  calculateSimilarity(profile1, profile2) {
    let similarity = 0;
    let comparisons = 0;
    Object.keys(profile1 || {}).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(profile2, key)) {
        comparisons++;
        if (profile1[key] === profile2[key]) {
          similarity++;
        }
      }
    });
    return comparisons > 0 ? (similarity / comparisons) * 100 : 0;
  }

  generateComparisionInsights(candidateProfile, similarities) {
    const insights = [];
    if (similarities[0] && similarities[0].score > 80) {
      insights.push(`Very similar to top performer (${Math.round(similarities[0].score)}% match)`);
    } else if (similarities[0] && similarities[0].score > 60) {
      insights.push('Moderate similarity to top performers');
    } else {
      insights.push('Unique profile - different from typical top performers');
    }
    const commonTraits = this.findCommonTraits(similarities.slice(0, 5));
    if (commonTraits.length > 0) {
      insights.push(`Shares key traits with top performers: ${commonTraits.join(', ')}`);
    }
    return insights;
  }

  findCommonTraits(topMatches) {
    const traitCounts = {};
    const total = topMatches.length || 1;
    topMatches.forEach(match => {
      const profile = match.performer && match.performer.profile || {};
      Object.entries(profile).forEach(([key, value]) => {
        const traitKey = `${key}:${value}`;
        traitCounts[traitKey] = (traitCounts[traitKey] || 0) + 1;
      });
    });
    const commonTraits = [];
    Object.entries(traitCounts).forEach(([trait, count]) => {
      if (count / total > 0.6) {
        commonTraits.push(trait.split(':')[1]);
      }
    });
    return commonTraits;
  }
}

module.exports = BenchmarkEngine;


