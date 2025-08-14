const fs = require('fs').promises;
const path = require('path');

class VerticalConfigManager {
    constructor() {
        this.verticals = new Map();
        this.customConfigs = new Map();
        this.loadDefaultVerticals();
    }

    async loadDefaultVerticals() {
        // Financial Advisory Vertical
        this.registerVertical('financial', {
            name: 'Financial Advisory Intelligence',
            description: 'Qualify and match prospects with financial advisors',
            icon: '💰',
            questions: [
                {
                    id: 'fin_priority',
                    text: "What's your #1 financial priority right now?",
                    type: 'single-choice',
                    options: [
                        { value: 'retirement', label: 'Planning for Retirement', weight: 1.2, icon: '🏖️' },
                        { value: 'taxes', label: 'Reducing Taxes', weight: 1.5, icon: '📊' },
                        { value: 'growth', label: 'Growing Wealth', weight: 1.0, icon: '📈' },
                        { value: 'protection', label: 'Protecting Family', weight: 1.3, icon: '🛡️' },
                        { value: 'estate', label: 'Estate Planning', weight: 1.4, icon: '🏛️' }
                    ],
                    scoringDimensions: ['urgency', 'sophistication']
                },
                {
                    id: 'fin_portfolio',
                    text: 'Current investment portfolio value?',
                    type: 'slider',
                    min: 0,
                    max: 10000000,
                    step: 50000,
                    format: 'currency',
                    scoringFunction: (value) => Math.min(value / 50000, 100),
                    scoringDimensions: ['financial_capacity']
                },
                {
                    id: 'fin_timeline',
                    text: 'When do you need to address this?',
                    type: 'single-choice',
                    options: [
                        { value: 'immediate', label: 'This Month', weight: 2.0 },
                        { value: 'quarter', label: 'This Quarter', weight: 1.5 },
                        { value: 'year', label: 'This Year', weight: 1.0 },
                        { value: 'exploring', label: 'Just Exploring', weight: 0.3 }
                    ],
                    scoringDimensions: ['urgency', 'intent']
                },
                {
                    id: 'fin_advisor',
                    text: 'Do you currently work with a financial advisor?',
                    type: 'single-choice',
                    options: [
                        { value: 'no', label: 'No', weight: 1.5 },
                        { value: 'yes_unhappy', label: 'Yes, but unhappy', weight: 2.0 },
                        { value: 'yes_happy', label: 'Yes, and happy', weight: 0.2 }
                    ],
                    scoringDimensions: ['opportunity']
                }
            ],
            scoringWeights: {
                financial_capacity: 0.25,
                urgency: 0.20,
                sophistication: 0.15,
                engagement: 0.15,
                intent: 0.15,
                behavioral: 0.10
            },
            tierThresholds: [
                { min: 90, name: 'DIAMOND', color: '#8B4789', icon: '💎' },
                { min: 80, name: 'PLATINUM', color: '#E5E4E2', icon: '🏆' },
                { min: 70, name: 'GOLD', color: '#FFD700', icon: '🥇' },
                { min: 60, name: 'SILVER', color: '#C0C0C0', icon: '🥈' },
                { min: 0, name: 'BRONZE', color: '#CD7F32', icon: '🥉' }
            ],
            behavioralMarkers: {
                highValue: [
                    'portfolio > 1000000',
                    'income > 500000',
                    'multiple_properties'
                ],
                urgentNeeds: [
                    'timeline = immediate',
                    'life_event_recent',
                    'tax_deadline_approaching'
                ],
                qualified: [
                    'score > 70',
                    'engagement > 80',
                    'complete_responses'
                ]
            },
            reportTemplates: {
                consumer: 'financial/consumer-wealth-report.html',
                advisor: 'financial/advisor-intelligence-dossier.html',
                executive: 'financial/executive-summary.html'
            }
        });

        // Hiring & Recruitment Vertical
        this.registerVertical('hiring', {
            name: 'Talent Intelligence Platform',
            description: 'Assess and match candidates with opportunities',
            icon: '🎯',
            questions: [
                {
                    id: 'hire_experience',
                    text: 'Years of relevant experience?',
                    type: 'single-choice',
                    options: [
                        { value: '0-2', label: 'Entry Level (0-2)', weight: 0.6 },
                        { value: '3-5', label: 'Mid Level (3-5)', weight: 1.0 },
                        { value: '6-10', label: 'Senior Level (6-10)', weight: 1.3 },
                        { value: '10+', label: 'Expert Level (10+)', weight: 1.5 }
                    ],
                    scoringDimensions: ['experience', 'seniority']
                },
                {
                    id: 'hire_skills',
                    text: 'Select your top 3 core competencies',
                    type: 'multi-choice',
                    maxSelections: 3,
                    options: [
                        { value: 'leadership', label: 'Leadership', weight: 1.3 },
                        { value: 'technical', label: 'Technical Excellence', weight: 1.2 },
                        { value: 'communication', label: 'Communication', weight: 1.1 },
                        { value: 'strategic', label: 'Strategic Thinking', weight: 1.4 },
                        { value: 'innovation', label: 'Innovation', weight: 1.2 },
                        { value: 'execution', label: 'Execution', weight: 1.3 }
                    ],
                    scoringDimensions: ['skills_match', 'competency']
                },
                {
                    id: 'hire_motivation',
                    text: 'Primary motivation for new opportunity?',
                    type: 'single-choice',
                    options: [
                        { value: 'growth', label: 'Career Growth', weight: 1.3 },
                        { value: 'compensation', label: 'Better Compensation', weight: 1.0 },
                        { value: 'culture', label: 'Company Culture', weight: 1.4 },
                        { value: 'challenge', label: 'New Challenges', weight: 1.5 },
                        { value: 'location', label: 'Location/Remote', weight: 0.8 }
                    ],
                    scoringDimensions: ['cultural_fit', 'retention_risk']
                }
            ],
            scoringWeights: {
                experience: 0.25,
                skills_match: 0.25,
                cultural_fit: 0.20,
                growth_potential: 0.15,
                retention_risk: 0.10,
                behavioral: 0.05
            },
            tierThresholds: [
                { min: 85, name: 'PERFECT_FIT', color: '#10B981', icon: '⭐' },
                { min: 70, name: 'STRONG_CANDIDATE', color: '#3B82F6', icon: '✓' },
                { min: 55, name: 'POTENTIAL', color: '#F59E0B', icon: '📊' },
                { min: 0, name: 'NOT_QUALIFIED', color: '#EF4444', icon: '✗' }
            ]
        });

        // Customer Retention Vertical
        this.registerVertical('retention', {
            name: 'Customer Success Intelligence',
            description: 'Predict churn and identify expansion opportunities',
            icon: '🔄',
            questions: [
                {
                    id: 'ret_satisfaction',
                    text: 'How satisfied are you with our product?',
                    type: 'scale',
                    min: 1,
                    max: 10,
                    labels: ['Very Unsatisfied', 'Very Satisfied'],
                    scoringDimensions: ['satisfaction', 'churn_risk']
                },
                {
                    id: 'ret_usage',
                    text: 'How often do you use our product?',
                    type: 'single-choice',
                    options: [
                        { value: 'daily', label: 'Daily', weight: 1.5 },
                        { value: 'weekly', label: 'Weekly', weight: 1.0 },
                        { value: 'monthly', label: 'Monthly', weight: 0.5 },
                        { value: 'rarely', label: 'Rarely', weight: 0.2 }
                    ],
                    scoringDimensions: ['engagement', 'value_realization']
                },
                {
                    id: 'ret_recommend',
                    text: 'How likely are you to recommend us? (NPS)',
                    type: 'scale',
                    min: 0,
                    max: 10,
                    scoringDimensions: ['advocacy', 'satisfaction']
                }
            ],
            scoringWeights: {
                satisfaction: 0.30,
                engagement: 0.25,
                value_realization: 0.20,
                advocacy: 0.15,
                behavioral: 0.10
            },
            tierThresholds: [
                { min: 80, name: 'CHAMPION', color: '#10B981', icon: '🏆' },
                { min: 60, name: 'SATISFIED', color: '#3B82F6', icon: '😊' },
                { min: 40, name: 'AT_RISK', color: '#F59E0B', icon: '⚠️' },
                { min: 0, name: 'CHURNING', color: '#EF4444', icon: '🚨' }
            ]
        });

        // Competitive Intelligence Vertical
        this.registerVertical('competitor', {
            name: 'Competitive Intelligence Engine',
            description: 'Understand competitor users and switch intent',
            icon: '🎯',
            questions: [
                {
                    id: 'comp_current',
                    text: 'What solution are you currently using?',
                    type: 'single-choice',
                    options: [
                        { value: 'competitor_a', label: 'Competitor A', weight: 1.5 },
                        { value: 'competitor_b', label: 'Competitor B', weight: 1.3 },
                        { value: 'in_house', label: 'In-house Solution', weight: 1.0 },
                        { value: 'none', label: 'No Solution Yet', weight: 2.0 }
                    ],
                    scoringDimensions: ['opportunity', 'switch_likelihood']
                },
                {
                    id: 'comp_pain',
                    text: 'Biggest pain point with current solution?',
                    type: 'single-choice',
                    options: [
                        { value: 'cost', label: 'Too Expensive', weight: 1.3 },
                        { value: 'features', label: 'Missing Features', weight: 1.5 },
                        { value: 'support', label: 'Poor Support', weight: 1.4 },
                        { value: 'performance', label: 'Performance Issues', weight: 1.6 },
                        { value: 'none', label: 'No Major Issues', weight: 0.3 }
                    ],
                    scoringDimensions: ['pain_severity', 'switch_likelihood']
                },
                {
                    id: 'comp_timeline',
                    text: 'When are you evaluating alternatives?',
                    type: 'single-choice',
                    options: [
                        { value: 'now', label: 'Actively Now', weight: 2.0 },
                        { value: 'quarter', label: 'This Quarter', weight: 1.5 },
                        { value: 'year', label: 'This Year', weight: 1.0 },
                        { value: 'future', label: 'Future Planning', weight: 0.4 }
                    ],
                    scoringDimensions: ['urgency', 'intent']
                }
            ],
            scoringWeights: {
                switch_likelihood: 0.30,
                pain_severity: 0.25,
                opportunity: 0.20,
                urgency: 0.15,
                behavioral: 0.10
            }
        });
    }

    registerVertical(id, config) {
        this.verticals.set(id, {
            id,
            ...config,
            createdAt: new Date(),
            version: '1.0.0'
        });
    }

    getVertical(id) {
        return this.verticals.get(id);
    }

    getAllVerticals() {
        return Array.from(this.verticals.values());
    }

    async saveVerticalConfig(tenantId, verticalId, customConfig) {
        const key = `${tenantId}-${verticalId}`;
        this.customConfigs.set(key, customConfig);
        
        // Persist to database
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        await pool.query(
            "UPDATE tenants SET config = jsonb_set(config, '{verticals}', $1) WHERE id = $2",
            [JSON.stringify(customConfig), tenantId]
        );
    }

    getVerticalForTenant(tenantId, verticalId) {
        const key = `${tenantId}-${verticalId}`;
        const customConfig = this.customConfigs.get(key);
        const baseConfig = this.getVertical(verticalId);
        
        if (!baseConfig) return null;
        
        // Merge custom config with base config
        return customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
    }
}

module.exports = VerticalConfigManager;


