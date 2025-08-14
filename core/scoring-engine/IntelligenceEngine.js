class IntelligenceEngine {
    constructor() {
        this.version = '3.0.0';
        this.algorithms = new Map();
        this.mlModels = new Map();
        this.loadAlgorithms();
    }

    loadAlgorithms() {
        // 12-Dimensional Scoring Algorithm
        this.algorithms.set('12-dimensional', {
            name: '12-Dimensional Intelligence Algorithm',
            dimensions: [
                'financial_capacity',
                'urgency',
                'sophistication',
                'engagement',
                'authority',
                'budget',
                'need',
                'timeline',
                'decision_process',
                'champion_strength',
                'technical_fit',
                'cultural_fit'
            ],
            calculate: async (responses, behaviorData, config) => {
                const scores = {};
                const weights = config.weights || this.getDefaultWeights();
                let totalScore = 0;

                // Calculate each dimension
                for (const dimension of this.algorithms.get('12-dimensional').dimensions) {
                    const score = await this.calculateDimension(
                        dimension, 
                        responses, 
                        behaviorData,
                        config
                    );
                    scores[dimension] = score;
                    totalScore += score * (weights[dimension] || 0.083);
                }

                // Apply behavioral modifiers
                const behavioralMultiplier = this.calculateBehavioralMultiplier(behaviorData);
                totalScore *= behavioralMultiplier;

                return {
                    algorithm: '12-dimensional',
                    totalScore: Math.round(Math.min(totalScore, 100)),
                    dimensionScores: scores,
                    behavioralMultiplier,
                    confidence: this.calculateConfidence(behaviorData),
                    timestamp: new Date().toISOString()
                };
            }
        });

        // ML Predictive Algorithm
        this.algorithms.set('ml-predictive', {
            name: 'Machine Learning Predictive Model',
            calculate: async (responses, behaviorData, config) => {
                // Feature extraction
                const features = this.extractFeatures(responses, behaviorData);
                
                // Model prediction (placeholder for actual ML integration)
                const predictions = await this.runMLModel(features, config.modelId);
                
                return {
                    algorithm: 'ml-predictive',
                    predictions: {
                        conversionProbability: predictions.conversion || 0.5,
                        lifetimeValue: predictions.ltv || 0,
                        churnRisk: predictions.churn || 0.2,
                        recommendedActions: predictions.actions || []
                    },
                    confidence: predictions.confidence || 0.7,
                    timestamp: new Date().toISOString()
                };
            }
        });

        // Behavioral Intelligence Algorithm
        this.algorithms.set('behavioral', {
            name: 'Deep Behavioral Analysis',
            calculate: async (responses, behaviorData) => {
                const analysis = {
                    engagementLevel: this.analyzeEngagement(behaviorData),
                    decisionPattern: this.analyzeDecisionPattern(behaviorData),
                    trustSignals: this.identifyTrustSignals(behaviorData),
                    riskSignals: this.identifyRiskSignals(behaviorData),
                    personalityMarkers: this.extractPersonalityMarkers(behaviorData),
                    cognitiveLoad: this.measureCognitiveLoad(behaviorData)
                };

                return {
                    algorithm: 'behavioral',
                    analysis,
                    score: this.behavioralScore(analysis),
                    insights: this.generateBehavioralInsights(analysis),
                    timestamp: new Date().toISOString()
                };
            }
        });
    }

    async calculateDimension(dimension, responses, behaviorData, config) {
        const calculators = {
            financial_capacity: () => {
                const portfolio = parseInt(responses.portfolio) || 0;
                const income = parseInt(responses.income) || 0;
                const assets = parseInt(responses.assets) || 0;
                
                let score = 0;
                score += Math.min(portfolio / 100000, 40);
                score += Math.min(income / 10000, 30);
                score += Math.min(assets / 200000, 30);
                
                return Math.min(score, 100);
            },
            
            urgency: () => {
                let score = 50;
                const timeline = responses.timeline || 'exploring';
                
                const timelineScores = {
                    'immediate': 100,
                    'this_month': 90,
                    'quarter': 75,
                    'year': 50,
                    'exploring': 25
                };
                
                score = timelineScores[timeline] || 50;
                
                // Behavioral urgency signals
                if (behaviorData.averageQuestionTime < 5000) score += 10;
                if (behaviorData.scrollDepth > 90) score += 10;
                
                return Math.min(score, 100);
            },
            
            sophistication: () => {
                let score = 40;
                
                // Response sophistication
                if (responses.experience === 'expert') score += 30;
                else if (responses.experience === 'advanced') score += 20;
                else if (responses.experience === 'intermediate') score += 10;
                
                // Technical sophistication
                if (behaviorData.device?.type === 'desktop') score += 10;
                if (behaviorData.device?.screenWidth > 1920) score += 10;
                
                // Interaction sophistication
                if (behaviorData.mouseMovements?.length > 100) score += 10;
                
                return Math.min(score, 100);
            },
            
            engagement: () => {
                let score = 0;
                
                // Time engagement
                const totalTime = behaviorData.totalTime || 0;
                if (totalTime > 60000) score += 30; // > 1 minute
                else if (totalTime > 30000) score += 20; // > 30 seconds
                else if (totalTime > 15000) score += 10; // > 15 seconds
                
                // Interaction engagement
                const interactions = behaviorData.totalInteractions || 0;
                score += Math.min(interactions * 2, 30);
                
                // Scroll engagement
                const scrollDepth = behaviorData.scrollDepth || 0;
                score += (scrollDepth / 100) * 20;
                
                // Focus engagement
                if (!behaviorData.tabSwitches || behaviorData.tabSwitches < 2) score += 20;
                
                return Math.min(score, 100);
            },
            
            authority: () => {
                const jobLevel = responses.jobLevel || 'individual';
                const decisionMaker = responses.decisionMaker === 'yes';
                
                const levelScores = {
                    'c_level': 100,
                    'vp': 85,
                    'director': 70,
                    'manager': 55,
                    'team_lead': 45,
                    'individual': 30
                };
                
                let score = levelScores[jobLevel] || 30;
                if (decisionMaker) score = Math.min(score * 1.2, 100);
                
                return score;
            },
            
            budget: () => {
                const budgetStatus = responses.budgetStatus || 'none';
                const budgetSize = parseInt(responses.budgetSize) || 0;
                
                const statusScores = {
                    'allocated': 100,
                    'approved': 85,
                    'requested': 60,
                    'planned': 40,
                    'exploring': 25,
                    'none': 10
                };
                
                let score = statusScores[budgetStatus] || 25;
                
                // Adjust for budget size
                if (budgetSize > 1000000) score = Math.min(score * 1.3, 100);
                else if (budgetSize > 100000) score = Math.min(score * 1.1, 100);
                
                return score;
            },
            
            need: () => {
                let score = 50;
                
                // Pain points
                const painPoints = responses.painPoints || [];
                score += painPoints.length * 10;
                
                // Current solution dissatisfaction
                if (responses.currentSolution === 'none') score += 20;
                else if (responses.satisfaction && responses.satisfaction < 5) score += 15;
                
                // Problem severity
                const severity = responses.problemSeverity || 'medium';
                const severityScores = {
                    'critical': 30,
                    'high': 20,
                    'medium': 10,
                    'low': 5
                };
                score += severityScores[severity] || 10;
                
                return Math.min(score, 100);
            },
            
            timeline: () => {
                const purchaseTimeline = responses.purchaseTimeline || 'exploring';
                const projectStart = responses.projectStart || 'future';
                
                const timelineScores = {
                    'immediate': 100,
                    'this_month': 85,
                    'this_quarter': 70,
                    'this_year': 50,
                    'next_year': 30,
                    'exploring': 15
                };
                
                return timelineScores[purchaseTimeline] || 
                       timelineScores[projectStart] || 25;
            },
            
            decision_process: () => {
                let score = 50;
                
                // Decision maker status
                if (responses.decisionMaker === 'yes') score += 30;
                else if (responses.decisionMaker === 'influence') score += 15;
                
                // Number of stakeholders (fewer is better for speed)
                const stakeholders = parseInt(responses.stakeholders) || 5;
                if (stakeholders <= 2) score += 20;
                else if (stakeholders <= 4) score += 10;
                
                // Approval process
                if (responses.approvalProcess === 'simple') score += 10;
                
                return Math.min(score, 100);
            },
            
            champion_strength: () => {
                let score = 40;
                
                // Advocacy willingness
                if (responses.willRecommend === 'yes') score += 30;
                if (responses.nps && responses.nps >= 9) score += 20;
                
                // Influence level
                const influence = responses.influence || 'medium';
                const influenceScores = {
                    'high': 30,
                    'medium': 15,
                    'low': 5
                };
                score += influenceScores[influence] || 15;
                
                return Math.min(score, 100);
            },
            
            technical_fit: () => {
                const requirements = responses.requirements || [];
                const techStack = responses.techStack || [];
                const integrations = responses.integrations || [];
                
                let score = 50;
                
                // Requirements match
                const ourCapabilities = config.capabilities || [];
                const matchedReqs = requirements.filter(r => ourCapabilities.includes(r));
                score += (matchedReqs.length / Math.max(requirements.length, 1)) * 30;
                
                // Tech stack compatibility
                const compatibleTech = config.compatibleTech || [];
                const matchedTech = techStack.filter(t => compatibleTech.includes(t));
                score += (matchedTech.length / Math.max(techStack.length, 1)) * 20;
                
                return Math.min(score, 100);
            },
            
            cultural_fit: () => {
                let score = 50;
                
                const values = responses.companyValues || [];
                const workStyle = responses.workStyle || 'balanced';
                const priorities = responses.priorities || [];
                
                // Value alignment
                const ourValues = config.companyValues || ['innovation', 'excellence', 'integrity'];
                const alignedValues = values.filter(v => ourValues.includes(v));
                score += (alignedValues.length / Math.max(values.length, 1)) * 30;
                
                // Work style match
                const styleScores = {
                    'fast_paced': 20,
                    'balanced': 15,
                    'methodical': 10
                };
                score += styleScores[workStyle] || 15;
                
                return Math.min(score, 100);
            }
        };

        const calculator = calculators[dimension];
        return calculator ? calculator() : 50;
    }

    calculateBehavioralMultiplier(behaviorData) {
        let multiplier = 1.0;
        
        // Quick, confident responses
        if (behaviorData.averageQuestionTime > 3000 && 
            behaviorData.averageQuestionTime < 15000) {
            multiplier += 0.05;
        }
        
        // Low hesitation
        if (behaviorData.hesitations && behaviorData.hesitations < 2) {
            multiplier += 0.05;
        }
        
        // High completion
        if (behaviorData.completionRate > 90) {
            multiplier += 0.05;
        }
        
        // No rage clicks
        if (!behaviorData.rageClicks || behaviorData.rageClicks === 0) {
            multiplier += 0.05;
        }
        
        return Math.min(multiplier, 1.2);
    }

    calculateConfidence(behaviorData) {
        let confidence = 70;
        
        // Data completeness
        if (behaviorData.completionRate > 95) confidence += 10;
        else if (behaviorData.completionRate > 80) confidence += 5;
        
        // Response consistency
        if (behaviorData.corrections && behaviorData.corrections < 2) confidence += 10;
        
        // Engagement quality
        if (behaviorData.engagementScore > 80) confidence += 10;
        
        return Math.min(confidence, 100);
    }

    analyzeEngagement(behaviorData) {
        const factors = {
            timeOnPage: behaviorData.totalTime || 0,
            scrollDepth: behaviorData.scrollDepth || 0,
            interactions: behaviorData.totalInteractions || 0,
            focusTime: behaviorData.focusTime || 0,
            mouseActivity: behaviorData.mouseMovements?.length || 0
        };
        
        // Calculate engagement score
        let score = 0;
        if (factors.timeOnPage > 30000) score += 25;
        if (factors.scrollDepth > 75) score += 25;
        if (factors.interactions > 10) score += 20;
        if (factors.focusTime > factors.timeOnPage * 0.8) score += 20;
        if (factors.mouseActivity > 50) score += 10;
        
        return {
            score,
            level: score > 80 ? 'high' : score > 50 ? 'medium' : 'low',
            factors
        };
    }

    analyzeDecisionPattern(behaviorData) {
        const patterns = [];
        
        // Identify decision-making patterns
        if (behaviorData.averageQuestionTime < 5000) {
            patterns.push('quick_decision_maker');
        }
        
        if (behaviorData.corrections && behaviorData.corrections > 3) {
            patterns.push('deliberative');
        }
        
        if (behaviorData.scrollReturns && behaviorData.scrollReturns > 2) {
            patterns.push('thorough_reviewer');
        }
        
        if (behaviorData.hesitations && behaviorData.hesitations.length > 0) {
            patterns.push('cautious');
        }
        
        return patterns;
    }

    identifyTrustSignals(behaviorData) {
        const signals = [];
        
        if (behaviorData.corrections && behaviorData.corrections < 2) {
            signals.push('confident_responses');
        }
        
        if (behaviorData.completionRate > 90) {
            signals.push('high_commitment');
        }
        
        if (behaviorData.scrollDepth > 80) {
            signals.push('thorough_review');
        }
        
        if (!behaviorData.rageClicks || behaviorData.rageClicks === 0) {
            signals.push('smooth_experience');
        }
        
        if (behaviorData.returnVisit) {
            signals.push('return_visitor');
        }
        
        return signals;
    }

    identifyRiskSignals(behaviorData) {
        const signals = [];
        
        if (behaviorData.averageQuestionTime < 2000) {
            signals.push('rushing_through');
        }
        
        if (behaviorData.corrections && behaviorData.corrections > 5) {
            signals.push('high_uncertainty');
        }
        
        if (behaviorData.rageClicks && behaviorData.rageClicks > 0) {
            signals.push('frustration_detected');
        }
        
        if (behaviorData.tabSwitches && behaviorData.tabSwitches > 5) {
            signals.push('distracted');
        }
        
        if (behaviorData.incompleteFields && behaviorData.incompleteFields > 2) {
            signals.push('low_commitment');
        }
        
        return signals;
    }

    extractPersonalityMarkers(behaviorData) {
        const markers = [];
        
        // Analytical vs Intuitive
        if (behaviorData.hoverTime && behaviorData.hoverTime > 10000) {
            markers.push('analytical');
        } else if (behaviorData.averageQuestionTime < 5000) {
            markers.push('intuitive');
        }
        
        // Detail-oriented vs Big-picture
        if (behaviorData.scrollReturns && behaviorData.scrollReturns > 3) {
            markers.push('detail_oriented');
        }
        
        // Risk tolerance
        if (behaviorData.skipOptional && behaviorData.skipOptional > 0.5) {
            markers.push('efficiency_focused');
        }
        
        return markers;
    }

    measureCognitiveLoad(behaviorData) {
        let load = 'normal';
        
        const indicators = {
            highPauseTime: behaviorData.maxPauseTime > 30000,
            manyCorrections: behaviorData.corrections > 4,
            longHesitations: behaviorData.hesitations?.some(h => h.duration > 15000),
            frequentScrolling: behaviorData.scrollEvents > 20
        };
        
        const highLoadCount = Object.values(indicators).filter(v => v).length;
        
        if (highLoadCount >= 3) load = 'high';
        else if (highLoadCount >= 1) load = 'moderate';
        else load = 'low';
        
        return { load, indicators };
    }

    behavioralScore(analysis) {
        let score = 50;
        
        // Engagement contribution
        score += analysis.engagementLevel.score * 0.3;
        
        // Trust signals boost
        score += analysis.trustSignals.length * 5;
        
        // Risk signals penalty
        score -= analysis.riskSignals.length * 5;
        
        // Cognitive load adjustment
        if (analysis.cognitiveLoad.load === 'low') score += 10;
        else if (analysis.cognitiveLoad.load === 'high') score -= 10;
        
        return Math.max(0, Math.min(100, score));
    }

    generateBehavioralInsights(analysis) {
        const insights = [];
        
        // Engagement insights
        if (analysis.engagementLevel.level === 'high') {
            insights.push({
                type: 'positive',
                message: 'Highly engaged prospect - prioritize for immediate follow-up'
            });
        }
        
        // Decision pattern insights
        if (analysis.decisionPattern.includes('quick_decision_maker')) {
            insights.push({
                type: 'tactical',
                message: 'Fast decision maker - emphasize key benefits quickly'
            });
        }
        
        // Risk insights
        if (analysis.riskSignals.includes('rushing_through')) {
            insights.push({
                type: 'warning',
                message: 'May be providing surface-level responses - verify interest'
            });
        }
        
        // Personality insights
        if (analysis.personalityMarkers.includes('analytical')) {
            insights.push({
                type: 'approach',
                message: 'Analytical personality - provide detailed data and proof points'
            });
        }
        
        return insights;
    }

    extractFeatures(responses, behaviorData) {
        // Extract features for ML model
        return {
            // Response features
            responseCompleteness: Object.keys(responses).length,
            ...responses,
            
            // Behavioral features
            totalTime: behaviorData.totalTime,
            scrollDepth: behaviorData.scrollDepth,
            interactions: behaviorData.totalInteractions,
            corrections: behaviorData.corrections,
            hesitations: behaviorData.hesitations?.length || 0,
            
            // Device features
            deviceType: behaviorData.device?.type,
            screenSize: behaviorData.device?.screenWidth,
            
            // Temporal features
            hourOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };
    }

    async runMLModel(features, modelId) {
        // Placeholder for ML model integration
        // In production, this would call your ML service
        
        // Mock prediction
        return {
            conversion: 0.65 + Math.random() * 0.3,
            ltv: Math.random() * 100000,
            churn: Math.random() * 0.3,
            confidence: 0.75 + Math.random() * 0.2,
            actions: [
                'Schedule demo within 24 hours',
                'Assign to senior sales rep',
                'Include executive in first call'
            ]
        };
    }

    getDefaultWeights() {
        return {
            financial_capacity: 0.10,
            urgency: 0.10,
            sophistication: 0.08,
            engagement: 0.08,
            authority: 0.09,
            budget: 0.09,
            need: 0.09,
            timeline: 0.08,
            decision_process: 0.08,
            champion_strength: 0.07,
            technical_fit: 0.07,
            cultural_fit: 0.07
        };
    }

    async score(responses, behaviorData, config = {}) {
        const algorithm = config.algorithm || '12-dimensional';
        const scorer = this.algorithms.get(algorithm);
        
        if (!scorer) {
            throw new Error(`Algorithm ${algorithm} not found`);
        }
        
        const result = await scorer.calculate(responses, behaviorData, config);
        
        // Add tier classification
        result.tier = this.determineTier(result.totalScore, config.vertical);
        
        // Add actionable insights
        result.insights = await this.generateInsights(result, responses, behaviorData);
        
        // Add recommendations
        result.recommendations = await this.generateRecommendations(result);
        
        return result;
    }

    determineTier(score, vertical) {
        // Default tiers, can be customized per vertical
        const tiers = [
            { min: 90, name: 'ELITE', icon: '💎' },
            { min: 80, name: 'PREMIUM', icon: '🏆' },
            { min: 70, name: 'HIGH', icon: '🥇' },
            { min: 60, name: 'MEDIUM', icon: '🥈' },
            { min: 40, name: 'LOW', icon: '🥉' },
            { min: 0, name: 'ENTRY', icon: '📊' }
        ];
        
        return tiers.find(tier => score >= tier.min);
    }

    async generateInsights(result, responses, behaviorData) {
        const insights = [];
        
        // Score-based insights
        if (result.totalScore > 85) {
            insights.push({
                type: 'priority',
                title: 'High-Value Prospect',
                message: 'This lead scores in the top 10% - immediate action recommended'
            });
        }
        
        // Dimension-specific insights
        Object.entries(result.dimensionScores).forEach(([dimension, score]) => {
            if (score > 80) {
                insights.push({
                    type: 'strength',
                    dimension,
                    message: `Strong ${dimension} indicator (${score}/100)`
                });
            } else if (score < 40) {
                insights.push({
                    type: 'concern',
                    dimension,
                    message: `Low ${dimension} score may impact conversion`
                });
            }
        });
        
        // Behavioral insights
        if (behaviorData.engagementScore > 80) {
            insights.push({
                type: 'behavioral',
                title: 'High Engagement',
                message: 'Prospect showed strong interest through interaction patterns'
            });
        }
        
        return insights;
    }
    
    async generateRecommendations(result) {
        const recommendations = [];
        
        if (result.totalScore > 80) {
            recommendations.push('Assign to senior sales representative');
            recommendations.push('Schedule follow-up within 2 hours');
            recommendations.push('Prepare custom demo focused on identified needs');
        } else if (result.totalScore > 60) {
            recommendations.push('Add to nurture campaign');
            recommendations.push('Send relevant case studies');
            recommendations.push('Schedule follow-up within 24 hours');
        } else {
            recommendations.push('Add to long-term nurture sequence');
            recommendations.push('Monitor for engagement signals');
        }
        
        return recommendations;
    }
}

module.exports = IntelligenceEngine;


