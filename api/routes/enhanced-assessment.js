'use strict';

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DeepBehavioralIntelligence = require('../../core/behavioral-intelligence/DeepBehavioral');
const ConsistencyChecker = require('../../core/consistency-engine/ConsistencyChecker');
const BenchmarkEngine = require('../../core/scoring-engine/BenchmarkEngine');

const behavioralSessions = new Map();
const benchmarkEngine = new BenchmarkEngine(pool);

// Require API key auth
const apiKeyAuth = require('../middleware/auth');

router.post('/session/start', apiKeyAuth, async (req, res) => {
  const { assessmentId } = req.body || {};
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const tracker = new DeepBehavioralIntelligence(sessionId);
  behavioralSessions.set(sessionId, tracker);
  res.json({ sessionId, assessmentId, startTime: Date.now() });
});

router.post('/session/:sessionId/event', apiKeyAuth, async (req, res) => {
  const { sessionId } = req.params;
  const { eventType, data } = req.body || {};
  const tracker = behavioralSessions.get(sessionId);
  if (!tracker) return res.status(404).json({ error: 'Session not found' });
  switch (eventType) {
    case 'question_start':
      if (data && data.questionId) tracker.trackQuestionTiming(data.questionId);
      break;
    case 'answer_change':
      if (data) tracker.trackAnswerChange(data.questionId, data.oldAnswer, data.newAnswer);
      break;
    case 'hesitation':
      if (data) tracker.data.hesitations.push(data);
      break;
    default:
      break;
  }
  res.json({ success: true });
});

// Submit assessment with enhanced intelligence
router.post('/submit', apiKeyAuth, async (req, res) => {
  const { sessionId, responses, metadata } = req.body || {};
  const tenantId = req.tenant && req.tenant.id;
  
  try {
    const tracker = behavioralSessions.get(sessionId);
    const behavioralReport = tracker ? tracker.generateIntelligenceReport() : null;
    const consistencyChecker = new ConsistencyChecker();
    const consistencyReport = consistencyChecker.checkConsistency(responses || {});
    const scores = await calculateEnhancedScores(responses || {}, behavioralReport, consistencyReport);
    const percentile = await benchmarkEngine.calculatePercentileRank(scores.totalScore, tenantId);
    const comparison = await benchmarkEngine.compareToTopPerformers(responses || {}, tenantId);
    
    // Extract contact information from metadata
    const contactInfo = metadata && metadata.contactInfo || {};
    
    const result = await pool.query(
      `INSERT INTO leads (
          lead_id, tenant_id, assessment_id,
          first_name, last_name, email, phone,
          company, job_title,
          responses, behavioral_data,
          raw_scores, final_score, tier,
          ai_insights,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
      [
        `lead_${Date.now()}`,
        tenantId,
        metadata && metadata.assessmentId || null,
        contactInfo.first_name || null,
        contactInfo.last_name || null,
        contactInfo.email || null,
        contactInfo.phone || null,
        contactInfo.company || null,
        contactInfo.job_title || null,
        JSON.stringify(responses || {}),
        JSON.stringify(behavioralReport || {}),
        JSON.stringify(scores.dimensionScores || {}),
        scores.totalScore,
        scores.tier,
        JSON.stringify({
          percentile,
          comparison,
          consistency: consistencyReport,
          behavioral: behavioralReport
        }),
        new Date()
      ]
    );
    
    // Clean up session
    behavioralSessions.delete(sessionId);
    
    res.json({
      success: true,
      leadId: result.rows[0] && result.rows[0].id,
      intelligence: {
        totalScore: scores.totalScore,
        tier: scores.tier,
        percentile,
        consistencyScore: consistencyReport && consistencyReport.score,
        behavioralInsights: behavioralReport && behavioralReport.insights,
        recommendations: generateRecommendations(scores, behavioralReport, consistencyReport)
      }
    });
    
  } catch (error) {
    console.error('Assessment submission error:', error);
    res.status(500).json({ error: 'Failed to process assessment' });
  }
});

router.get('/benchmarks', apiKeyAuth, async (req, res) => {
  try {
    const distribution = await benchmarkEngine.getDistribution(req.tenant && req.tenant.id);
    const totalCandidates = distribution.reduce((a, b) => a + Number(b.count || 0), 0);
    const averageScore = totalCandidates > 0
      ? distribution.reduce((a, b) => a + (Number(b.avg_score || 0) * Number(b.count || 0)), 0) / totalCandidates
      : 0;
    res.json({ distribution, totalCandidates, averageScore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get benchmarks' });
  }
});

function calculateEnhancedScores(responses, behavioralReport, consistencyReport) {
  let totalScore = 70;
  if (behavioralReport) {
    totalScore = (totalScore + behavioralReport.engagementScore) / 2;
    totalScore = (totalScore + behavioralReport.confidenceScore) / 2;
  }
  totalScore = (totalScore + (consistencyReport && consistencyReport.score || 0)) / 2;
  const tier = totalScore >= 85 ? 'ELITE' :
               totalScore >= 70 ? 'HIGH_POTENTIAL' :
               totalScore >= 55 ? 'SOLID' :
               'DEVELOPING';
  return {
    totalScore: Math.round(totalScore),
    tier,
    dimensionScores: {
      behavioral: (behavioralReport && behavioralReport.confidenceScore) || 0,
      consistency: (consistencyReport && consistencyReport.score) || 0,
      engagement: (behavioralReport && behavioralReport.engagementScore) || 0
    }
  };
}

function generateRecommendations(scores, behavioralReport, consistencyReport) {
  const recommendations = [];
  if (scores.tier === 'ELITE' || scores.tier === 'HIGH_POTENTIAL') {
    recommendations.push('Fast-track for interview');
  }
  if (consistencyReport && consistencyReport.score < 70) {
    recommendations.push('Verify responses in interview - consistency concerns');
  }
  if (behavioralReport && behavioralReport.stressLevel === 'high') {
    recommendations.push('May need additional support - high stress detected');
  }
  if (behavioralReport && behavioralReport.energyPattern === 'sustained_high') {
    recommendations.push('High stamina candidate - good for demanding roles');
  }
  return recommendations;
}

module.exports = router;


