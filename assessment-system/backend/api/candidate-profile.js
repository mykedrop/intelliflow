// backend/api/candidate-profile.js

class CandidateProfile {
    constructor() {
        this.profileTemplate = {
            personal: {},
            assessment: {},
            behavioral: {},
            psychological: {},
            recommendations: {},
            metadata: {}
        };
    }
    
    async build(data, results) {
        try {
            const profile = {
                id: this.generateProfileId(),
                timestamp: new Date().toISOString(),
                sessionId: data.sessionId,
                personal: this.buildPersonalInfo(data),
                assessment: this.buildAssessmentInfo(results),
                behavioral: this.buildBehavioralProfile(data.behaviorData),
                psychological: this.buildPsychologicalProfile(data.responses),
                recommendations: this.buildRecommendations(results),
                metadata: this.buildMetadata(data, results)
            };
            
            return profile;
        } catch (error) {
            console.error('Error building candidate profile:', error);
            throw error;
        }
    }
    
    generateProfileId() {
        return 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    buildPersonalInfo(data) {
        const personal = {
            contact: data.contact || {},
            experience: data.contact?.experience || 'unknown',
            assessmentDate: new Date().toISOString(),
            completionTime: data.behaviorData?.duration || 0
        };
        
        // Add typing profile analysis if available
        if (data.contactTypingProfile) {
            personal.typingProfile = {
                hasTypingData: data.contactTypingProfile.hasTypingData,
                averageConsistency: data.contactTypingProfile.averageConsistency,
                copyPasteUsage: data.contactTypingProfile.copyPasteUsage,
                hesitationFields: data.contactTypingProfile.hesitationFields
            };
        }
        
        return personal;
    }
    
    buildAssessmentInfo(results) {
        return {
            overallScore: results.scores?.overall || 0,
            behavioralScore: this.calculateBehavioralScore(results.scores?.behavioral),
            responseScore: this.calculateResponseScore(results.scores?.responses),
            contradictions: results.analysis?.contradictions || {},
            completionStatus: 'completed',
            assessmentVersion: '1.0.0'
        };
    }
    
    calculateBehavioralScore(behavioralScores) {
        if (!behavioralScores) return 0;
        
        const weights = {
            confidence: 0.25,
            stressManagement: 0.25,
            attention: 0.20,
            honesty: 0.20,
            engagement: 0.10
        };
        
        let weightedScore = 0;
        let totalWeight = 0;
        
        Object.entries(weights).forEach(([key, weight]) => {
            if (behavioralScores[key] !== undefined) {
                weightedScore += behavioralScores[key] * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    }
    
    calculateResponseScore(responseScores) {
        if (!responseScores) return 0;
        
        const weights = {
            ethical: 0.30,
            decisionMaking: 0.25,
            communication: 0.20,
            problemSolving: 0.15,
            teamwork: 0.10
        };
        
        let weightedScore = 0;
        let totalWeight = 0;
        
        Object.entries(weights).forEach(([key, weight]) => {
            if (responseScores[key] !== undefined) {
                weightedScore += responseScores[key] * weight;
                totalWeight += weight;
            }
        });
        
        return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
    }
    
    buildBehavioralProfile(behaviorData) {
        if (!behaviorData) {
            return {
                confidence: 'unknown',
                stressLevel: 'unknown',
                attentionSpan: 'unknown',
                honesty: 'unknown',
                engagement: 'unknown'
            };
        }
        
        const summary = behaviorData.summary || {};
        
        return {
            confidence: this.categorizeConfidence(summary.confidenceScore),
            stressLevel: summary.stressLevel || 'unknown',
            peakStress: summary.peakStress || 'unknown',
            attentionSpan: this.categorizeAttention(summary.tabSwitches, summary.anomalyScore),
            honesty: this.categorizeHonesty(behaviorData.data?.anomalies),
            engagement: this.categorizeEngagement(summary),
            responseTime: this.categorizeResponseTime(summary.averageResponseTime),
            consistency: this.categorizeConsistency(summary.anomalyScore)
        };
    }
    
    categorizeConfidence(score) {
        if (score >= 90) return 'very_high';
        if (score >= 80) return 'high';
        if (score >= 70) return 'moderate';
        if (score >= 60) return 'low';
        return 'very_low';
    }
    
    categorizeAttention(tabSwitches, anomalyScore) {
        if (tabSwitches === 0 && anomalyScore < 5) return 'excellent';
        if (tabSwitches <= 2 && anomalyScore < 10) return 'good';
        if (tabSwitches <= 5 && anomalyScore < 20) return 'moderate';
        return 'poor';
    }
    
    categorizeHonesty(anomalies) {
        if (!anomalies) return 'unknown';
        
        let score = 100;
        if (anomalies.devToolsOpened > 0) score -= 50;
        if (anomalies.rightClickAttempts > 0) score -= 20;
        if (anomalies.rapidClicking > 5) score -= 15;
        
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'moderate';
        return 'poor';
    }
    
    categorizeEngagement(summary) {
        const skippedQuestions = summary.skippedQuestions || 0;
        const timeouts = summary.timeouts || 0;
        
        if (skippedQuestions === 0 && timeouts === 0) return 'excellent';
        if (skippedQuestions <= 1 && timeouts <= 1) return 'good';
        if (skippedQuestions <= 3 && timeouts <= 2) return 'moderate';
        return 'poor';
    }
    
    categorizeResponseTime(averageTime) {
        if (averageTime < 5000) return 'very_fast';
        if (averageTime < 10000) return 'fast';
        if (averageTime < 15000) return 'moderate';
        if (averageTime < 20000) return 'deliberate';
        return 'slow';
    }
    
    categorizeConsistency(anomalyScore) {
        if (anomalyScore < 5) return 'excellent';
        if (anomalyScore < 15) return 'good';
        if (anomalyScore < 25) return 'moderate';
        return 'poor';
    }
    
    buildPsychologicalProfile(responses) {
        if (!responses) {
            return {
                decisionStyle: 'unknown',
                riskTolerance: 'unknown',
                ethicalFramework: 'unknown',
                communicationStyle: 'unknown',
                teamwork: 'unknown'
            };
        }
        
        return {
            decisionStyle: this.analyzeDecisionStyle(responses),
            riskTolerance: this.analyzeRiskTolerance(responses),
            ethicalFramework: this.analyzeEthicalFramework(responses),
            communicationStyle: this.analyzeCommunicationStyle(responses),
            teamwork: this.analyzeTeamwork(responses),
            stressResponse: this.analyzeStressResponse(responses)
        };
    }
    
    analyzeDecisionStyle(responses) {
        // Analyze decision-making patterns
        const decisions = [];
        
        if (responses['pressure_response']) {
            const response = responses['pressure_response'].value;
            if (response === 'immediate_answer') decisions.push('reactive');
            if (response === 'prepare_first') decisions.push('analytical');
            if (response === 'scheduled_callback') decisions.push('process-oriented');
        }
        
        if (responses['priority_matrix']) {
            decisions.push('systematic');
        }
        
        if (decisions.length === 0) return 'unknown';
        return decisions[0]; // Return primary decision style
    }
    
    analyzeRiskTolerance(responses) {
        // Analyze risk tolerance from responses
        let conservativeCount = 0;
        let aggressiveCount = 0;
        
        if (responses['risk_young_conservative']) {
            if (responses['risk_young_conservative'].value === 'support') conservativeCount++;
            if (responses['risk_young_conservative'].value === 'challenge') aggressiveCount++;
        }
        
        if (responses['risk_old_aggressive']) {
            if (responses['risk_old_aggressive'].value === 'support') aggressiveCount++;
            if (responses['risk_old_aggressive'].value === 'challenge') conservativeCount++;
        }
        
        if (conservativeCount > aggressiveCount) return 'conservative';
        if (aggressiveCount > conservativeCount) return 'aggressive';
        return 'moderate';
    }
    
    analyzeEthicalFramework(responses) {
        // Analyze ethical decision-making
        let ethicalScore = 100;
        
        if (responses['ethical_boundary']) {
            const response = responses['ethical_boundary'].value;
            if (response === 'consider_terms') ethicalScore -= 50;
            if (response === 'explore_legal') ethicalScore -= 40;
        }
        
        if (responses['confidence_under_ignorance']) {
            const response = responses['confidence_under_ignorance'].value;
            if (response === 'fake_knowledge') ethicalScore -= 30;
        }
        
        if (ethicalScore >= 90) return 'strong';
        if (ethicalScore >= 80) return 'good';
        if (ethicalScore >= 70) return 'moderate';
        return 'weak';
    }
    
    analyzeCommunicationStyle(responses) {
        // Analyze communication preferences
        if (responses['email_response_panic']) {
            const emailResponse = responses['email_response_panic'].value;
            
            if (emailResponse && emailResponse.length > 100) {
                return 'detailed';
            } else if (emailResponse && emailResponse.length > 50) {
                return 'balanced';
            } else {
                return 'concise';
            }
        }
        
        return 'unknown';
    }
    
    analyzeTeamwork(responses) {
        // Analyze teamwork orientation
        let teamScore = 0;
        
        if (responses['day_simulation']) {
            const decisions = responses['day_simulation'].value;
            if (decisions && decisions.some(d => d.decision.includes('team'))) {
                teamScore += 20;
            }
            if (decisions && decisions.some(d => d.decision.includes('colleague'))) {
                teamScore += 15;
            }
        }
        
        if (teamScore >= 20) return 'high';
        if (teamScore >= 10) return 'moderate';
        return 'low';
    }
    
    analyzeStressResponse(responses) {
        // Analyze how they handle stress
        if (responses['pressure_response']) {
            const response = responses['pressure_response'].value;
            if (response === 'immediate_answer') return 'reactive';
            if (response === 'prepare_first') return 'analytical';
            if (response === 'scheduled_callback') return 'process-oriented';
            if (response === 'voicemail_tomorrow') return 'boundary-setting';
        }
        
        return 'unknown';
    }
    
    buildRecommendations(results) {
        const recommendations = results.recommendations || [];
        
        return {
            overall: this.determineOverallRecommendation(results.scores?.overall),
            behavioral: this.determineBehavioralRecommendation(results.scores?.behavioral),
            development: this.identifyDevelopmentAreas(results),
            nextSteps: this.suggestNextSteps(results)
        };
    }
    
    determineOverallRecommendation(overallScore) {
        if (overallScore >= 90) {
            return {
                decision: 'strong_hire',
                confidence: 'high',
                reasoning: 'Outstanding performance across all dimensions'
            };
        } else if (overallScore >= 80) {
            return {
                decision: 'hire',
                confidence: 'medium',
                reasoning: 'Strong candidate with solid performance'
            };
        } else if (overallScore >= 70) {
            return {
                decision: 'conditional',
                confidence: 'low',
                reasoning: 'Potential candidate requiring development'
            };
        } else {
            return {
                decision: 'no_hire',
                confidence: 'high',
                reasoning: 'Does not meet minimum requirements'
            };
        }
    }
    
    determineBehavioralRecommendation(behavioralScores) {
        if (!behavioralScores) return { status: 'unknown' };
        
        const concerns = [];
        
        if (behavioralScores.stressManagement < 70) {
            concerns.push('stress_management');
        }
        
        if (behavioralScores.honesty < 80) {
            concerns.push('integrity');
        }
        
        if (behavioralScores.attention < 70) {
            concerns.push('focus');
        }
        
        if (concerns.length === 0) {
            return { status: 'excellent', concerns: [] };
        }
        
        return {
            status: 'concerns',
            concerns: concerns,
            priority: concerns.includes('integrity') ? 'high' : 'medium'
        };
    }
    
    identifyDevelopmentAreas(results) {
        const areas = [];
        
        if (results.scores?.behavioral?.stressManagement < 70) {
            areas.push({
                area: 'Stress Management',
                priority: 'medium',
                description: 'Develop coping strategies for high-pressure situations',
                resources: ['Stress management training', 'Mindfulness practices', 'Time management skills']
            });
        }
        
        if (results.scores?.responses?.ethical < 80) {
            areas.push({
                area: 'Ethical Decision Making',
                priority: 'high',
                description: 'Strengthen ethical framework and boundary setting',
                resources: ['Ethics training', 'Case study analysis', 'Mentorship programs']
            });
        }
        
        if (results.scores?.responses?.communication < 70) {
            areas.push({
                area: 'Communication Skills',
                priority: 'medium',
                description: 'Improve professional communication and client interaction',
                resources: ['Communication workshops', 'Role-playing exercises', 'Feedback sessions']
            });
        }
        
        return areas;
    }
    
    suggestNextSteps(results) {
        const overallScore = results.scores?.overall || 0;
        const steps = [];
        
        if (overallScore >= 80) {
            steps.push('Schedule final interview with hiring manager');
            steps.push('Prepare offer letter and onboarding plan');
            steps.push('Assign mentor for first 90 days');
        } else if (overallScore >= 70) {
            steps.push('Schedule follow-up interview to address concerns');
            steps.push('Consider probationary period with specific goals');
            steps.push('Provide targeted development resources');
        } else {
            steps.push('Thank candidate for their time');
            steps.push('Consider for other roles if appropriate');
            steps.push('Provide constructive feedback if requested');
        }
        
        return steps;
    }
    
    buildMetadata(data, results) {
        return {
            assessmentDuration: data.behaviorData?.duration || 0,
            questionsAnswered: Object.keys(data.responses || {}).length,
            contradictionsFound: (data.contradictions || []).length,
            behavioralAnomalies: data.behaviorData?.data?.anomalies || {},
            processingTimestamp: new Date().toISOString(),
            systemVersion: '1.0.0'
        };
    }
}

module.exports = CandidateProfile;
