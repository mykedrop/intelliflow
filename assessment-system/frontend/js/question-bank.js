// js/question-bank.js

const questionBank = {
    // Psychological depth questions
    psychological: [
        {
            id: 'pressure_response',
            category: 'stress_management',
            text: 'Your top client just lost 40% of their portfolio value in a single day. They\'re calling you at 11pm, clearly panicked.',
            subtext: 'What\'s your immediate response?',
            type: 'timed_response',
            timeLimit: 15000, // 15 seconds to answer
            options: [
                {
                    value: 'immediate_answer',
                    label: 'Pick up immediately',
                    psychProfile: { availability: 10, boundaries: 2, empathy: 8 }
                },
                {
                    value: 'scheduled_callback',
                    label: 'Text back scheduling a morning call',
                    psychProfile: { availability: 5, boundaries: 9, process: 10 }
                },
                {
                    value: 'prepare_first',
                    label: 'Call back in 15 minutes after reviewing their portfolio',
                    psychProfile: { availability: 7, boundaries: 6, analytical: 10 }
                },
                {
                    value: 'voicemail_tomorrow',
                    label: 'Let it go to voicemail, respond first thing tomorrow',
                    psychProfile: { availability: 2, boundaries: 10, process: 7 }
                }
            ],
            behaviorTracking: {
                measureHesitation: true,
                measureMouseHover: true,
                penaltyForTimeout: true
            }
        },
        
        {
            id: 'ethical_boundary',
            category: 'ethics',
            text: 'A wealthy client hints they\'ll give you a $50,000 "gift" if you help structure their accounts to minimize their divorce settlement.',
            subtext: 'Your response?',
            type: 'scenario',
            options: [
                {
                    value: 'firm_decline',
                    label: 'Immediately and firmly decline',
                    psychProfile: { ethics: 10, greed: 0, professionalism: 10 }
                },
                {
                    value: 'redirect_legal',
                    label: 'Suggest they speak with their attorney about legal options',
                    psychProfile: { ethics: 8, diplomacy: 10, avoidance: 5 }
                },
                {
                    value: 'explore_legal',
                    label: 'Explore what legal options might exist',
                    psychProfile: { ethics: 4, opportunism: 7, rationalization: 8 }
                },
                {
                    value: 'consider_terms',
                    label: 'Ask for more details about what they need',
                    psychProfile: { ethics: 2, greed: 8, risk_taking: 9 }
                }
            ],
            flagForReview: ['explore_legal', 'consider_terms']
        },
        
        {
            id: 'confidence_under_ignorance',
            category: 'knowledge_gaps',
            text: 'A client asks about a complex derivatives strategy you\'ve heard of but don\'t fully understand.',
            subtext: 'How do you handle this?',
            type: 'scenario',
            options: [
                {
                    value: 'admit_research',
                    label: 'Admit you need to research it and get back to them',
                    psychProfile: { honesty: 10, humility: 9, growth_mindset: 10 }
                },
                {
                    value: 'general_response',
                    label: 'Give a general response and redirect to strategies you know',
                    psychProfile: { honesty: 5, deflection: 8, confidence: 7 }
                },
                {
                    value: 'fake_knowledge',
                    label: 'Pretend to understand and speak generally about derivatives',
                    psychProfile: { honesty: 2, ego: 9, risk_taking: 8 }
                },
                {
                    value: 'partner_referral',
                    label: 'Immediately refer them to a colleague who specializes in this',
                    psychProfile: { honesty: 9, collaboration: 10, client_focus: 10 }
                }
            ]
        }
    ],
    
    // Contradiction pairs (ask these separately to catch inconsistencies)
    contradictionPairs: [
        {
            pair: ['risk_young_conservative', 'risk_old_aggressive'],
            questions: [
                {
                    id: 'risk_young_conservative',
                    text: 'A 25-year-old with $100k inheritance wants to put it all in conservative bonds.',
                    type: 'quick_decision',
                    options: [
                        { value: 'support', label: 'Support their conservative approach' },
                        { value: 'educate', label: 'Educate about time horizon and growth potential' },
                        { value: 'mixed', label: 'Suggest a balanced approach' },
                        { value: 'challenge', label: 'Strongly advocate for growth investments' }
                    ]
                },
                {
                    id: 'risk_old_aggressive',
                    text: 'A 65-year-old retiree wants to put their entire retirement in high-growth tech stocks.',
                    type: 'quick_decision',
                    options: [
                        { value: 'support', label: 'Support their growth strategy' },
                        { value: 'educate', label: 'Educate about sequence of returns risk' },
                        { value: 'mixed', label: 'Suggest a balanced approach' },
                        { value: 'challenge', label: 'Strongly advocate for conservative investments' }
                    ]
                }
            ]
        }
    ],
    
    // Interactive simulations
    simulations: [
        {
            id: 'email_response_panic',
            type: 'email_simulation',
            scenario: {
                from: 'Robert Chen <rchen@email.com>',
                subject: 'URGENT: MARKET CRASHING - SELL EVERYTHING NOW!!!',
                timestamp: '3:47 AM',
                body: `I just saw the news - market futures down 8%! 
                
                This is 2008 all over again! I NEED you to sell EVERYTHING first thing when markets open.
                
                I don\'t care about penalties or taxes. GET ME OUT NOW!
                
                My wife is freaking out. We can\'t go through this again.
                
                CALL ME AS SOON AS YOU GET THIS!
                
                - Robert`,
                
                clientProfile: {
                    age: 52,
                    portfolioValue: '$1.2M',
                    riskTolerance: 'Moderate',
                    previousPanicSells: 2
                }
            },
            measureMetrics: {
                responseTime: true, // How long to compose
                wordCount: true,
                emotionalTone: true, // Calm vs reactive
                solutionOffered: true,
                empathyShown: true,
                boundariesSet: true
            },
            scoringRubric: {
                excellent: 'Acknowledges concern, provides calm perspective, offers specific meeting, no immediate action',
                good: 'Calming tone, requests discussion before action',
                poor: 'Agrees to sell immediately or dismissive of concerns'
            }
        },
        
        {
            id: 'priority_matrix',
            type: 'drag_drop_priority',
            scenario: {
                context: 'It\'s Monday, 8:00 AM. You have the following items to handle:',
                items: [
                    {
                        id: 'nervous_client',
                        title: 'Nervous client from Friday',
                        details: 'Left 3 voicemails over weekend about market volatility',
                        urgency: 'high',
                        importance: 'high'
                    },
                    {
                        id: 'new_prospect',
                        title: '$2M prospect meeting at 2pm',
                        details: 'Referred by your top client, needs prep',
                        urgency: 'medium',
                        importance: 'high'
                    },
                    {
                        id: 'team_conflict',
                        title: 'Team member conflict',
                        details: 'Two junior advisors had heated argument Friday',
                        urgency: 'medium',
                        importance: 'medium'
                    },
                    {
                        id: 'compliance',
                        title: 'Compliance deadline today',
                        details: 'Quarterly filing due by 5pm',
                        urgency: 'high',
                        importance: 'medium'
                    },
                    {
                        id: 'research',
                        title: 'Market research for presentation',
                        details: 'Thursday presentation to investment committee',
                        urgency: 'low',
                        importance: 'high'
                    },
                    {
                        id: 'birthday',
                        title: 'Important client\'s birthday',
                        details: 'Your biggest client ($5M AUM) birthday today',
                        urgency: 'medium',
                        importance: 'low'
                    }
                ],
                instruction: 'Drag items into your action order for the day. We\'ll measure your prioritization logic.'
            },
            measureMetrics: {
                dragPatterns: true, // How many times they rearrange
                timeToDecide: true,
                finalOrder: true,
                hoveredOptions: true // Which they considered
            }
        }
    ],
    
    // Slider matrix questions
    sliderMatrix: [
        {
            id: 'work_style_matrix',
            text: 'Adjust these sliders to match your authentic work style:',
            subtext: 'Position each slider where you naturally operate',
            type: 'slider_matrix',
            dimensions: [
                {
                    id: 'process_intuition',
                    left: 'Process-Driven',
                    right: 'Intuition-Driven',
                    leftDescription: 'I follow systematic procedures',
                    rightDescription: 'I trust my gut instincts'
                },
                {
                    id: 'individual_team',
                    left: 'Individual Performer',
                    right: 'Team Builder',
                    leftDescription: 'I work best independently',
                    rightDescription: 'I thrive in collaborative settings'
                },
                {
                    id: 'conservative_risk',
                    left: 'Conservative',
                    right: 'Risk-Taker',
                    leftDescription: 'I prefer proven strategies',
                    rightDescription: 'I embrace calculated risks'
                },
                {
                    id: 'analytical_emotional',
                    left: 'Analytical',
                    right: 'Emotional Intelligence',
                    leftDescription: 'I focus on data and logic',
                    rightDescription: 'I prioritize relationships and emotions'
                },
                {
                    id: 'planner_adapter',
                    left: 'Detailed Planner',
                    right: 'Agile Adapter',
                    leftDescription: 'I plan everything meticulously',
                    rightDescription: 'I adjust quickly to changes'
                }
            ],
            behaviorTracking: {
                microAdjustments: true, // Track small tweaks
                timeOnEachSlider: true,
                revisits: true, // Coming back to adjust
                finalPositions: true,
                consistency: true // Compare to other answers
            }
        }
    ],
    
    // Video response questions (optional but powerful)
    videoQuestions: [
        {
            id: 'elevator_pitch',
            text: 'You\'re in an elevator with a potential client. You have 30 seconds.',
            type: 'video_response',
            timeLimit: 30000,
            instruction: 'Record your elevator pitch. We\'ll analyze your communication style.',
            measureMetrics: {
                actualLength: true,
                wordSpeed: true,
                filler_words: ['um', 'uh', 'like', 'you know'],
                confidence_indicators: true,
                eye_contact: true // If camera enabled
            }
        }
    ],
    
    // Rapid-fire personality assessment
    rapidFire: [
        {
            id: 'rapid_preferences',
            type: 'rapid_fire',
            timePerQuestion: 3000, // 3 seconds each
            instruction: 'Quick decisions - go with your gut!',
            questions: [
                {
                    text: 'Morning meeting or evening event?',
                    options: ['Morning meeting', 'Evening event']
                },
                {
                    text: 'Excel spreadsheet or whiteboard session?',
                    options: ['Excel spreadsheet', 'Whiteboard session']
                },
                {
                    text: 'Phone call or email?',
                    options: ['Phone call', 'Email']
                },
                {
                    text: 'Work from home or office?',
                    options: ['Home', 'Office']
                },
                {
                    text: 'Detailed agenda or open discussion?',
                    options: ['Detailed agenda', 'Open discussion']
                },
                {
                    text: 'Individual bonus or team bonus?',
                    options: ['Individual', 'Team']
                },
                {
                    text: 'Proven method or new approach?',
                    options: ['Proven method', 'New approach']
                },
                {
                    text: 'Deep expertise or broad knowledge?',
                    options: ['Deep expertise', 'Broad knowledge']
                }
            ]
        }
    ],
    
    // Day-in-life simulation
    daySimulation: {
        id: 'full_day_simulation',
        type: 'day_simulation',
        title: 'A Day in Your Life as a Northwestern Mutual Advisor',
        scenario: {
            startTime: '7:00 AM',
            endTime: '7:00 PM',
            events: [
                {
                    time: '7:00 AM',
                    event: 'Morning Routine',
                    decision: {
                        text: 'You wake up to 12 emails and 3 missed calls from clients about overnight market drop.',
                        options: [
                            'Check emails immediately',
                            'Stick to morning routine first',
                            'Quick market check then emails',
                            'Call most worried client back'
                        ]
                    }
                },
                {
                    time: '8:30 AM',
                    event: 'Office Arrival',
                    decision: {
                        text: 'Your assistant says a walk-in prospect is waiting (no appointment).',
                        options: [
                            'See them immediately',
                            'Have assistant schedule for later',
                            'Quick 5-minute greeting then schedule',
                            'Pass to another advisor'
                        ]
                    }
                },
                {
                    time: '10:00 AM',
                    event: 'Client Meeting',
                    decision: {
                        text: 'Scheduled client reveals they\'re getting divorced and needs to hide assets.',
                        options: [
                            'Firmly explain you cannot help with that',
                            'Refer to divorce attorney',
                            'End meeting immediately',
                            'Try to understand their concerns first'
                        ]
                    }
                },
                {
                    time: '12:00 PM',
                    event: 'Lunch Decision',
                    decision: {
                        text: 'You have a lunch scheduled with a colleague, but top client calls with urgent need.',
                        options: [
                            'Cancel lunch, handle client',
                            'Ask client to wait until after lunch',
                            'Bring colleague to client meeting',
                            'Handle client while walking to lunch'
                        ]
                    }
                },
                {
                    time: '2:00 PM',
                    event: 'Prospect Presentation',
                    decision: {
                        text: 'Mid-presentation, prospect reveals they\'re interviewing 5 advisors.',
                        options: [
                            'Continue as planned',
                            'Ask what they\'re looking for in an advisor',
                            'Pivot to differentiating yourself',
                            'Suggest skipping to Q&A'
                        ]
                    }
                },
                {
                    time: '4:00 PM',
                    event: 'Team Issue',
                    decision: {
                        text: 'Junior advisor made a $10,000 error in client\'s account.',
                        options: [
                            'Fix it quietly yourself',
                            'Report to compliance immediately',
                            'Coach junior through fixing it',
                            'Call client to explain'
                        ]
                    }
                },
                {
                    time: '5:30 PM',
                    event: 'End of Day',
                    decision: {
                        text: 'Family dinner at 6:30 but client wants emergency meeting.',
                        options: [
                            'Stay for client meeting',
                            'Schedule for tomorrow morning',
                            'Quick phone call instead',
                            'Have another advisor handle it'
                        ]
                    }
                }
            ]
        },
        scoring: {
            workLifeBalance: 0,
            clientFirst: 0,
            teamPlayer: 0,
            ethical: 0,
            efficiency: 0,
            stressManagement: 0
        }
    }
};

// Helper functions for question selection and management
class QuestionManager {
    constructor() {
        this.askedQuestions = new Set();
        this.questionFlow = [];
        this.currentPhase = 'contact';
        this.responses = {};
        this.contradictions = [];
    }
    
    getNextQuestion(previousResponse = null) {
        // Adaptive question selection based on previous responses
        if (this.currentPhase === 'psychological') {
            return this.selectPsychologicalQuestion(previousResponse);
        } else if (this.currentPhase === 'contradiction') {
            return this.selectContradictionQuestion();
        } else if (this.currentPhase === 'simulation') {
            return this.selectSimulation();
        } else if (this.currentPhase === 'rapid') {
            return this.selectRapidFire();
        }
    }
    
    selectPsychologicalQuestion(previousResponse) {
        // Select questions that probe deeper based on previous answers
        const availableQuestions = questionBank.psychological.filter(
            q => !this.askedQuestions.has(q.id)
        );
        
        if (previousResponse) {
            // If previous response showed high stress, add a stress management question
            // If previous response showed ethical flexibility, add an ethics question
            // etc.
        }
        
        if (availableQuestions.length > 0) {
            const selected = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
            this.askedQuestions.add(selected.id);
            return selected;
        }
        
        return null;
    }
    
    selectContradictionQuestion() {
        // Select paired questions separated by other questions
        for (const pair of questionBank.contradictionPairs) {
            const firstAsked = pair.questions[0].id in this.responses;
            const secondAsked = pair.questions[1].id in this.responses;
            
            if (!firstAsked) {
                this.askedQuestions.add(pair.questions[0].id);
                return pair.questions[0];
            } else if (!secondAsked && this.questionFlow.length - this.questionFlow.indexOf(pair.questions[0].id) > 3) {
                // Ask second question only after 3+ questions gap
                this.askedQuestions.add(pair.questions[1].id);
                return pair.questions[1];
            }
        }
        
        return null;
    }
    
    selectSimulation() {
        const available = questionBank.simulations.filter(
            s => !this.askedQuestions.has(s.id)
        );
        
        if (available.length > 0) {
            const selected = available[0]; // Or use selection logic
            this.askedQuestions.add(selected.id);
            return selected;
        }
        
        return null;
    }
    
    selectRapidFire() {
        // Usually only one rapid-fire section
        if (!this.askedQuestions.has('rapid_preferences')) {
            this.askedQuestions.add('rapid_preferences');
            return questionBank.rapidFire[0];
        }
        
        return null;
    }
    
    checkForContradictions(questionId, response) {
        // Check if this response contradicts previous responses
        const contradictionChecks = [
            {
                check: 'risk_consistency',
                questions: ['risk_young_conservative', 'risk_old_aggressive'],
                analyze: (responses) => {
                    // If they support conservative for young but aggressive for old, that's contradictory
                    if (responses['risk_young_conservative'] === 'support' && 
                        responses['risk_old_aggressive'] === 'challenge') {
                        return { contradicted: true, severity: 'high' };
                    }
                    return { contradicted: false };
                }
            }
        ];
        
        for (const check of contradictionChecks) {
            if (check.questions.includes(questionId)) {
                const result = check.analyze(this.responses);
                if (result.contradicted) {
                    this.contradictions.push({
                        type: check.check,
                        severity: result.severity,
                        questions: check.questions,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    
    recordResponse(questionId, response, metadata = {}) {
        this.responses[questionId] = {
            value: response,
            timestamp: Date.now(),
            ...metadata
        };
        
        this.questionFlow.push(questionId);
        this.checkForContradictions(questionId, response);
    }
    
    getAssessmentProgress() {
        const totalExpected = 20; // Adjust based on your assessment length
        const completed = this.questionFlow.length;
        
        return {
            percentage: (completed / totalExpected) * 100,
            completed,
            total: totalExpected,
            currentPhase: this.currentPhase,
            contradictionsFound: this.contradictions.length
        };
    }
}

// Export for use in main assessment engine
window.QuestionManager = QuestionManager;
window.questionBank = questionBank;
