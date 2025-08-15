// backend/api/scoring-engine.js

class ScoringEngine {
    constructor() {
        this.scoringWeights = {
            ethicalIntegrity: 0.30,
            stressResilience: 0.25,
            clientFocus: 0.20,
            consistency: 0.15,
            adaptability: 0.10
        };
    }
    
    async processAssessment(data) {
        try {
            const results = {
                timestamp: new Date().toISOString(),
                sessionId: data.sessionId,
                scores: {},
                analysis: {},
                recommendations: []
            };
            
            // Process behavioral data
            results.scores.behavioral = this.scoreBehavioralData(data.behaviorData);
            
            // Process question responses
            results.scores.responses = this.scoreQuestionResponses(data.responses);
            
            // Process contradictions
            results.analysis.contradictions = this.analyzeContradictions(data.contradictions);
            
            // Calculate overall score
            results.scores.overall = this.calculateOverallScore(results.scores);
            
            // Generate recommendations
            results.recommendations = this.generateRecommendations(results);
            
            return results;
        } catch (error) {
            console.error('Error processing assessment:', error);
            throw error;
        }
    }
    
    scoreBehavioralData(behaviorData) {
        const scores = {
            confidence: 0,
            stressManagement: 0,
            attention: 0,
            honesty: 0,
            engagement: 0
        };
        
        if (!behaviorData || !behaviorData.summary) {
            return scores;
        }
        
        const summary = behaviorData.summary;
        
        // Score confidence (0-100)
        scores.confidence = Math.max(0, Math.min(100, summary.confidenceScore || 0));
        
        // Score stress management (0-100)
        scores.stressManagement = this.scoreStressManagement(summary);
        
        // Score attention (0-100)
        scores.attention = this.scoreAttention(behaviorData);
        
        // Score honesty (0-100)
        scores.honesty = this.scoreHonesty(behaviorData);
        
        // Score engagement (0-100)
        scores.engagement = this.scoreEngagement(behaviorData);
        
        return scores;
    }
    
    scoreStressManagement(summary) {
        let score = 100;
        
        // Deduct for high stress levels
        if (summary.stressLevel === 'high') {
            score -= 40;
        } else if (summary.stressLevel === 'medium') {
            score -= 20;
        }
        
        // Deduct for peak stress
        if (summary.peakStress === 'high') {
            score -= 30;
        }
        
        // Bonus for maintaining confidence under stress
        if (summary.stressLevel === 'high' && summary.confidenceScore > 70) {
            score += 25; // Performed well despite stress
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    scoreAttention(behaviorData) {
        let score = 100;
        
        // Deduct for tab switches
        const tabSwitches = behaviorData.summary.tabSwitches || 0;
        score -= Math.min(tabSwitches * 5, 30);
        
        // Deduct for anomalies
        const anomalyScore = behaviorData.summary.anomalyScore || 0;
        score -= Math.min(anomalyScore * 2, 25);
        
        // Bonus for sustained attention
        if (tabSwitches === 0 && anomalyScore < 5) {
            score += 15;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    scoreHonesty(behaviorData) {
        let score = 100;
        
        // Deduct for suspicious patterns
        const anomalies = behaviorData.data.anomalies || {};
        
        if (anomalies.devToolsOpened > 0) {
            score -= 50;
        }
        
        if (anomalies.rightClickAttempts > 0) {
            score -= 20;
        }
        
        // Deduct for rapid clicking (potential cheating)
        if (anomalies.rapidClicking > 5) {
            score -= 15;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    scoreEngagement(behaviorData) {
        let score = 100;
        
        // Deduct for skipped questions
        const skippedQuestions = behaviorData.data.navigation.skippedQuestions || 0;
        score -= Math.min(skippedQuestions * 10, 30);
        
        // Deduct for timeouts
        const timeouts = behaviorData.data.anomalies.timeouts || 0;
        score -= Math.min(timeouts * 15, 25);
        
        // Bonus for consistent engagement
        if (skippedQuestions === 0 && timeouts === 0) {
            score += 20;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    scoreQuestionResponses(responses) {
        const scores = {
            ethical: 0,
            decisionMaking: 0,
            communication: 0,
            problemSolving: 0,
            teamwork: 0
        };
        
        if (!responses) {
            return scores;
        }
        
        // Score ethical responses
        scores.ethical = this.scoreEthicalResponses(responses);
        
        // Score decision making
        scores.decisionMaking = this.scoreDecisionMaking(responses);
        
        // Score communication
        scores.communication = this.scoreCommunication(responses);
        
        // Score problem solving
        scores.problemSolving = this.scoreProblemSolving(responses);
        
        // Score teamwork
        scores.teamwork = this.scoreTeamwork(responses);
        
        return scores;
    }
    
    scoreEthicalResponses(responses) {
        let score = 100;
        
        // Check for problematic ethical responses
        const ethicalQuestions = ['ethical_boundary', 'confidence_under_ignorance'];
        
        ethicalQuestions.forEach(questionId => {
            if (responses[questionId]) {
                const response = responses[questionId].value;
                
                // Severe penalties for unethical responses
                if (response === 'consider_terms' || response === 'explore_legal') {
                    score -= 60;
                } else if (response === 'fake_knowledge') {
                    score -= 40;
                } else if (response === 'general_response') {
                    score -= 20;
                }
            }
        });
        
        return Math.max(0, score);
    }
    
    scoreDecisionMaking(responses) {
        let score = 70; // Base score
        
        // Analyze decision patterns
        const decisionQuestions = ['pressure_response', 'risk_young_conservative', 'risk_old_aggressive'];
        
        decisionQuestions.forEach(questionId => {
            if (responses[questionId]) {
                const response = responses[questionId].value;
                
                // Score based on decision quality
                if (response === 'prepare_first' || response === 'educate') {
                    score += 10;
                } else if (response === 'immediate_answer' || response === 'support') {
                    score += 5;
                }
            }
        });
        
        return Math.min(100, score);
    }
    
    scoreCommunication(responses) {
        let score = 70; // Base score
        
        // Check for communication-related responses
        if (responses['email_response_panic']) {
            const emailResponse = responses['email_response_panic'].value;
            
            // Analyze email quality
            if (emailResponse && emailResponse.length > 50) {
                score += 15;
            }
            
            // Check for professional tone
            if (emailResponse && /^(dear|hello)/i.test(emailResponse)) {
                score += 10;
            }
        }
        
        return Math.min(100, score);
    }
    
    scoreProblemSolving(responses) {
        let score = 70; // Base score
        
        // Analyze problem-solving approach
        if (responses['priority_matrix']) {
            const priorityOrder = responses['priority_matrix'].value;
            
            // Check if they prioritized high-urgency, high-importance items first
            if (priorityOrder && priorityOrder.length > 0) {
                const firstItem = priorityOrder[0];
                if (firstItem.id === 'nervous_client' || firstItem.id === 'compliance') {
                    score += 15;
                }
            }
        }
        
        return Math.min(100, score);
    }
    
    scoreTeamwork(responses) {
        let score = 70; // Base score
        
        // Check for team-oriented responses
        const teamQuestions = ['day_simulation'];
        
        teamQuestions.forEach(questionId => {
            if (responses[questionId]) {
                const response = responses[questionId].value;
                
                // Look for team-focused decisions
                if (response && response.some(r => r.decision.includes('team') || r.decision.includes('colleague'))) {
                    score += 15;
                }
            }
        });
        
        return Math.min(100, score);
    }
    
    analyzeContradictions(contradictions) {
        if (!contradictions || contradictions.length === 0) {
            return {
                count: 0,
                severity: 'none',
                details: []
            };
        }
        
        const analysis = {
            count: contradictions.length,
            severity: 'low',
            details: contradictions.map(c => ({
                type: c.type,
                severity: c.severity,
                questions: c.questions,
                timestamp: c.timestamp
            }))
        };
        
        // Determine overall severity
        const highSeverityCount = contradictions.filter(c => c.severity === 'high').length;
        const mediumSeverityCount = contradictions.filter(c => c.severity === 'medium').length;
        
        if (highSeverityCount > 0) {
            analysis.severity = 'high';
        } else if (mediumSeverityCount > 0) {
            analysis.severity = 'medium';
        }
        
        return analysis;
    }
    
    calculateOverallScore(scores) {
        let overallScore = 0;
        let totalWeight = 0;
        
        // Calculate weighted score from behavioral data
        if (scores.behavioral) {
            const behavioralScore = (
                scores.behavioral.confidence * 0.25 +
                scores.behavioral.stressManagement * 0.25 +
                scores.behavioral.attention * 0.20 +
                scores.behavioral.honesty * 0.20 +
                scores.behavioral.engagement * 0.10
            );
            
            overallScore += behavioralScore * 0.4; // 40% weight for behavioral
            totalWeight += 0.4;
        }
        
        // Calculate weighted score from responses
        if (scores.responses) {
            const responseScore = (
                scores.responses.ethical * 0.30 +
                scores.responses.decisionMaking * 0.25 +
                scores.responses.communication * 0.20 +
                scores.responses.problemSolving * 0.15 +
                scores.responses.teamwork * 0.10
            );
            
            overallScore += responseScore * 0.6; // 60% weight for responses
            totalWeight += 0.6;
        }
        
        // Normalize to 0-100 scale
        return totalWeight > 0 ? Math.round(overallScore / totalWeight) : 0;
    }
    
    generateRecommendations(results) {
        const recommendations = [];
        const overallScore = results.scores.overall;
        
        // Overall performance recommendations
        if (overallScore >= 90) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: 'Excellent candidate with outstanding performance across all dimensions'
            });
        } else if (overallScore >= 80) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'Strong candidate with solid performance and minor areas for development'
            });
        } else if (overallScore >= 70) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'Good candidate with potential, requires focused development in key areas'
            });
        } else {
            recommendations.push({
                type: 'performance',
                priority: 'low',
                message: 'Candidate requires significant development before consideration'
            });
        }
    
        // Behavioral recommendations
        if (results.scores.behavioral) {
            if (results.scores.behavioral.stressManagement < 70) {
                recommendations.push({
                    type: 'behavioral',
                    priority: 'medium',
                    message: 'Consider stress management training and support systems'
                });
            }
            
            if (results.scores.behavioral.honesty < 80) {
                recommendations.push({
                    type: 'behavioral',
                    priority: 'high',
                    message: 'Integrity concerns require immediate attention and investigation'
                });
            }
        }
        
        // Contradiction recommendations
        if (results.analysis.contradictions.count > 0) {
            recommendations.push({
                type: 'consistency',
                priority: results.analysis.contradictions.severity === 'high' ? 'high' : 'medium',
                message: `Address ${results.analysis.contradictions.count} contradiction(s) in responses`
            });
        }
        
        return recommendations;
    }
}

module.exports = ScoringEngine;
