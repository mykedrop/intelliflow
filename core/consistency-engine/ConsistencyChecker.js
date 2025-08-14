'use strict';

class ConsistencyChecker {
  constructor() {
    this.rules = this.defineConsistencyRules();
    this.contradictions = [];
    this.consistencyScore = 100;
  }

  defineConsistencyRules() {
    return [
      {
        id: 'leadership_consistency',
        check: (responses) => {
          if (responses.work_style === 'coach' &&
              !(responses.strengths && responses.strengths.includes('Leadership'))) {
            return {
              type: 'contradiction',
              severity: 'medium',
              message: 'Selected coach work style but not leadership as strength'
            };
          }
          return null;
        }
      },
      {
        id: 'experience_skills_match',
        check: (responses) => {
          if (responses.experience === '0-2' &&
              responses.strengths && responses.strengths.includes('Strategic Thinking')) {
            return {
              type: 'unlikely',
              severity: 'low',
              message: 'Entry level with strategic thinking is uncommon'
            };
          }
          return null;
        }
      },
      {
        id: 'motivation_values_alignment',
        check: (responses) => {
          if (responses.motivation === 'stability' &&
              responses.risk_tolerance === 'aggressive') {
            return {
              type: 'contradiction',
              severity: 'high',
              message: 'Seeks stability but has aggressive risk tolerance'
            };
          }
          return null;
        }
      },
      {
        id: 'decision_style_consistency',
        check: (responses) => {
          if (responses.decision_style === 'analytical' &&
              responses.challenge_response === 'act') {
            return {
              type: 'contradiction',
              severity: 'medium',
              message: 'Analytical style but acts immediately on challenges'
            };
          }
          return null;
        }
      },
      {
        id: 'client_approach_personality',
        check: (responses) => {
          if (responses.client_approach === 'educator' &&
              !(responses.strengths && responses.strengths.includes('Communication'))) {
            return {
              type: 'concern',
              severity: 'low',
              message: 'Educator approach without communication strength'
            };
          }
          return null;
        }
      },
      {
        id: 'values_ranking_consistency',
        check: (responses) => {
          if (responses.values_rank &&
              responses.values_rank[0] === 'Work-Life Balance' &&
              responses.motivation === 'achievement') {
            return {
              type: 'potential_conflict',
              severity: 'medium',
              message: 'Top value is work-life balance but driven by achievement'
            };
          }
          return null;
        }
      },
      {
        id: 'gaming_detection',
        check: (responses) => {
          const perfectAnswers = ['achievement', 'leadership', 'strategic', 'aggressive'];
          let perfectCount = 0;
          Object.values(responses).forEach(value => {
            if (perfectAnswers.includes(value)) perfectCount++;
          });
          if (perfectCount > Object.keys(responses).length * 0.8) {
            return {
              type: 'gaming_suspected',
              severity: 'high',
              message: 'Possible gaming - too many "perfect" answers'
            };
          }
          return null;
        }
      }
    ];
  }

  checkConsistency(responses) {
    this.contradictions = [];
    this.consistencyScore = 100;

    this.rules.forEach(rule => {
      const result = rule.check(responses);
      if (result) {
        this.contradictions.push({ ruleId: rule.id, ...result });
        const deductions = { high: 20, medium: 10, low: 5 };
        this.consistencyScore -= deductions[result.severity] || 5;
      }
    });

    this.checkResponsePatterns(responses);

    return {
      score: Math.max(0, this.consistencyScore),
      contradictions: this.contradictions,
      integrity: this.calculateIntegrityLevel(),
      recommendations: this.generateRecommendations()
    };
  }

  checkResponsePatterns(responses) {
    const multiChoiceQuestions = ['strengths', 'goals', 'skills'];
    let patternDetected = false;
    multiChoiceQuestions.forEach(question => {
      if (responses[question] && Array.isArray(responses[question])) {
        if (responses[question].length === responses[question].filter(v => String(v).includes('Leadership')).length) {
          patternDetected = true;
        }
      }
    });
    if (patternDetected) {
      this.contradictions.push({
        type: 'pattern_detected',
        severity: 'medium',
        message: 'Suspicious selection pattern detected'
      });
      this.consistencyScore -= 15;
    }
  }

  calculateIntegrityLevel() {
    if (this.consistencyScore >= 90) return 'high';
    if (this.consistencyScore >= 70) return 'moderate';
    if (this.consistencyScore >= 50) return 'questionable';
    return 'low';
  }

  generateRecommendations() {
    const recommendations = [];
    if (this.consistencyScore < 70) {
      recommendations.push('Schedule follow-up interview to clarify contradictions');
    }
    const highSeverity = this.contradictions.filter(c => c.severity === 'high');
    if (highSeverity.length > 0) {
      recommendations.push('Red flags detected - careful review recommended');
    }
    if (this.contradictions.some(c => c.type === 'gaming_suspected')) {
      recommendations.push('Possible gaming detected - verify responses in interview');
    }
    return recommendations;
  }
}

module.exports = ConsistencyChecker;


