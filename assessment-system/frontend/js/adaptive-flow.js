// js/adaptive-flow.js

class AdaptiveFlowController {
    constructor(questionManager, behaviorTracker) {
        this.questionManager = questionManager;
        this.behaviorTracker = behaviorTracker;
        this.flowState = {
            phase: 'initialization',
            questionCount: 0,
            stressCheckpoints: [],
            adaptations: [],
            difficultyLevel: 'medium',
            userProfile: {
                responseSpeed: 'normal',
                consistency: 'unknown',
                stressResponse: 'unknown',
                ethicalFlexibility: 'unknown'
            }
        };
    }
    
    initializeFlow() {
        // Set up the assessment flow
        this.flowState.phase = 'contact';
        return this.getPhaseConfig('contact');
    }
    
    getPhaseConfig(phase) {
        const configs = {
            contact: {
                duration: 'user-controlled',
                tracking: ['typing_patterns', 'form_hesitation'],
                nextPhase: 'warmup'
            },
            warmup: {
                questions: 2,
                types: ['simple_scenario'],
                tracking: ['baseline_response_time', 'initial_confidence'],
                nextPhase: 'psychological'
            },
            psychological: {
                questions: 5,
                types: ['psychological', 'timed_response'],
                tracking: ['stress_response', 'decision_patterns'],
                adaptations: true,
                nextPhase: 'contradiction_check'
            },
            contradiction_check: {
                questions: 4,
                types: ['contradiction_pairs'],
                tracking: ['consistency', 'answer_changes'],
                adaptations: true,
                nextPhase: 'simulation'
            },
            simulation: {
                questions: 3,
                types: ['email_simulation', 'priority_matrix', 'drag_drop'],
                tracking: ['practical_skills', 'time_management'],
                nextPhase: 'rapid_fire'
            },
            rapid_fire: {
                questions: 1,
                types: ['rapid_fire'],
                tracking: ['instinct_responses', 'pressure_handling'],
                nextPhase: 'day_simulation'
            },
            day_simulation: {
                questions: 1,
                types: ['day_simulation'],
                tracking: ['holistic_performance', 'decision_consistency'],
                nextPhase: 'completion'
            },
            completion: {
                duration: 'automatic',
                actions: ['calculate_scores', 'generate_report', 'submit_data']
            }
        };
        
        return configs[phase] || configs.contact;
    }
    
    shouldAdaptFlow() {
        // Determine if we need to adapt based on user behavior
        const behaviorData = this.behaviorTracker.exportBehaviorData();
        const summary = behaviorData.summary;
        
        const adaptationTriggers = [];
        
        // High stress - simplify questions
        if (summary.stressLevel === 'high') {
            adaptationTriggers.push({
                type: 'high_stress',
                action: 'simplify_questions',
                severity: 'high'
            });
        }
        
        // Low confidence - add encouragement
        if (summary.confidenceScore < 50) {
            adaptationTriggers.push({
                type: 'low_confidence',
                action: 'add_encouragement',
                severity: 'medium'
            });
        }
        
        // Fast responses - increase difficulty
        if (summary.averageResponseTime < 5000) {
            adaptationTriggers.push({
                type: 'fast_responder',
                action: 'increase_difficulty',
                severity: 'low'
            });
        }
        
        // Many tab switches - potential cheating
        if (summary.tabSwitches > 5) {
            adaptationTriggers.push({
                type: 'potential_research',
                action: 'add_verification_question',
                severity: 'high'
            });
        }
        
        return adaptationTriggers;
    }
    
    applyAdaptations(triggers) {
        triggers.forEach(trigger => {
            switch(trigger.action) {
                case 'simplify_questions':
                    this.flowState.difficultyLevel = 'easy';
                    this.flowState.adaptations.push({
                        type: 'simplified',
                        reason: 'high_stress',
                        timestamp: Date.now()
                    });
                    break;
                    
                case 'add_encouragement':
                    // Add encouraging message before next question
                    this.showEncouragement();
                    break;
                    
                case 'increase_difficulty':
                    this.flowState.difficultyLevel = 'hard';
                    this.flowState.adaptations.push({
                        type: 'increased_difficulty',
                        reason: 'fast_responses',
                        timestamp: Date.now()
                    });
                    break;
                    
                case 'add_verification_question':
                    // Insert a verification question to check if they're researching answers
                    this.insertVerificationQuestion();
                    break;
            }
        });
    }
    
    showEncouragement() {
        // Display encouraging message
        const messages = [
            "You're doing great! Take your time with these questions.",
            "Remember, there are no perfect answers - we want to understand your authentic approach.",
            "You're making excellent progress. Keep going!",
            "Your thoughtful responses are exactly what we're looking for."
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.displayInterstitial(message, 'encouragement');
    }
    
    insertVerificationQuestion() {
        // Add a question that's hard to research
        const verificationQuestion = {
            id: 'verification_' + Date.now(),
            text: 'In exactly 7 words, describe your approach to client relationships.',
            type: 'text_exact',
            wordCount: 7,
            timeLimit: 30000,
            noResearch: true
        };
        
        // Insert into question flow
        this.questionManager.questionFlow.splice(
            this.questionManager.questionFlow.length,
            0,
            verificationQuestion
        );
    }
    
    displayInterstitial(message, type) {
        const container = document.getElementById('assessmentPhase');
        const interstitial = document.createElement('div');
        interstitial.className = 'interstitial-message fade-in';
        interstitial.innerHTML = `
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 my-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        ${type === 'encouragement' ? 
                            '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' :
                            '<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                        }
                    </div>
                    <div class="ml-3">
                        <p class="text-blue-800">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        container.insertBefore(interstitial, container.firstChild);
        
        setTimeout(() => {
            interstitial.style.opacity = '0';
            setTimeout(() => interstitial.remove(), 500);
        }, 4000);
    }
    
    transitionPhase(currentPhase) {
        const phaseTransitions = {
            'contact': 'warmup',
            'warmup': 'psychological',
            'psychological': 'contradiction_check',
            'contradiction_check': 'simulation',
            'simulation': 'rapid_fire',
            'rapid_fire': 'day_simulation',
            'day_simulation': 'completion'
        };
        
        const nextPhase = phaseTransitions[currentPhase];
        
        if (nextPhase) {
            this.flowState.phase = nextPhase;
            
            // Apply phase-specific setup
            this.setupPhase(nextPhase);
            
            return nextPhase;
        }
        
        return null;
    }
    
    setupPhase(phase) {
        switch(phase) {
            case 'rapid_fire':
                // Show countdown timer
                this.showCountdown(3, "Get ready for rapid-fire questions!");
                break;
                
            case 'day_simulation':
                // Show day simulation intro
                this.showDaySimulationIntro();
                break;
                
            case 'completion':
                // Trigger completion analytics
                this.completeAssessment();
                break;
        }
    }
    
    showCountdown(seconds, message) {
        const container = document.getElementById('assessmentPhase');
        const countdown = document.createElement('div');
        countdown.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        countdown.innerHTML = `
            <div class="bg-white rounded-2xl p-12 text-center">
                <h3 class="text-2xl font-bold mb-4">${message}</h3>
                <div class="text-6xl font-bold text-blue-600" id="countdownNumber">${seconds}</div>
            </div>
        `;
        
        document.body.appendChild(countdown);
        
        let currentCount = seconds;
        const interval = setInterval(() => {
            currentCount--;
            if (currentCount > 0) {
                document.getElementById('countdownNumber').textContent = currentCount;
            } else {
                clearInterval(interval);
                countdown.remove();
            }
        }, 1000);
    }
    
    showDaySimulationIntro() {
        const container = document.getElementById('assessmentPhase');
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 fade-in">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-4">Day in the Life Simulation</h2>
                    <p class="text-lg text-gray-600 mb-6">Experience a typical day as a Northwestern Mutual Financial Advisor</p>
                    <p class="text-gray-500">You'll face real scenarios throughout a simulated workday. Your decisions will help us understand your work style, priorities, and problem-solving approach.</p>
                </div>
                <button onclick="startDaySimulation()" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-lg">
                    Start Your Day →
                </button>
            </div>
        `;
    }
    
    completeAssessment() {
        // Gather all data
        const assessmentData = {
            behaviorData: this.behaviorTracker.exportBehaviorData(),
            responses: this.questionManager.responses,
            contradictions: this.questionManager.contradictions,
            flowAdaptations: this.flowState.adaptations,
            timeline: this.questionManager.questionFlow,
            profile: this.generateCandidateProfile()
        };
        
        // Submit to backend
        this.submitAssessment(assessmentData);
        
        // Show completion screen
        this.showCompletionScreen(assessmentData.profile);
    }
    
    generateCandidateProfile() {
        const responses = this.questionManager.responses;
        const behavior = this.behaviorTracker.exportBehaviorData().summary;
        
        return {
            // Personality traits
            personality: {
                stressResilience: this.calculateStressResilience(behavior),
                ethicalIntegrity: this.calculateEthicalScore(responses),
                clientFocus: this.calculateClientFocus(responses),
                teamOrientation: this.calculateTeamOrientation(responses),
                adaptability: this.calculateAdaptability(behavior, responses)
            },
            
            // Work style
            workStyle: {
                decisionSpeed: behavior.averageResponseTime < 10000 ? 'fast' : 'deliberate',
                riskTolerance: this.calculateRiskTolerance(responses),
                organizationMethod: this.determineOrganizationStyle(responses),
                communicationPreference: this.determineCommunicationStyle(responses)
            },
            
            // Red flags
            concerns: this.identifyConcerns(responses, behavior),
            
            // Strengths
            strengths: this.identifyStrengths(responses, behavior),
            
            // Overall fit score
            fitScore: this.calculateFitScore(responses, behavior),
            
            // Recommendation
            recommendation: this.generateRecommendation(responses, behavior)
        };
    }
    
    calculateStressResilience(behavior) {
        let score = 100;
        
        // Deduct for high stress
        if (behavior.stressLevel === 'high') score -= 30;
        else if (behavior.stressLevel === 'medium') score -= 15;
        
        // Deduct for peak stress
        if (behavior.peakStress === 'high') score -= 20;
        
        // Add for maintaining performance under stress
        if (behavior.stressLevel === 'high' && behavior.confidenceScore > 70) {
            score += 25; // Performed well despite stress
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    calculateEthicalScore(responses) {
        let score = 100;
        const ethicalQuestions = ['ethical_boundary', 'ethical_dilemma'];
        
        ethicalQuestions.forEach(questionId => {
            if (responses[questionId]) {
                const response = responses[questionId].value;
                
                // Check for problematic responses
                if (response === 'consider_terms' || response === 'explore_legal') {
                    score -= 50;
                } else if (response === 'fake_knowledge') {
                    score -= 30;
                }
            }
        });
        
        return Math.max(0, score);
    }
    
    calculateClientFocus(responses) {
        // Analyze responses for client-first mentality
        let score = 70; // Base score
        
        // Add points for client-focused decisions
        // Subtract for self-serving decisions
        
        return score;
    }
    
    calculateTeamOrientation(responses) {
        // Analyze responses for teamwork indicators
        let score = 70; // Base score
        
        return score;
    }
    
    calculateAdaptability(behavior, responses) {
        let score = 70;
        
        // High adaptability if handled stress well
        if (behavior.stressLevel === 'low' && behavior.anomalyScore < 5) {
            score += 20;
        }
        
        // Check for flexibility in responses
        // Look for balanced approaches
        
        return Math.min(100, score);
    }
    
    calculateRiskTolerance(responses) {
        // Analyze risk-related responses
        return 'moderate'; // or 'low', 'high'
    }
    
    determineOrganizationStyle(responses) {
        // Based on priority matrix and other responses
        return 'systematic'; // or 'flexible', 'adaptive'
    }
    
    determineCommunicationStyle(responses) {
        // Based on communication preferences
        return 'balanced'; // or 'direct', 'empathetic', 'analytical'
    }
    
    identifyConcerns(responses, behavior) {
        const concerns = [];
        
        // Ethical concerns
        if (this.calculateEthicalScore(responses) < 70) {
            concerns.push({
                type: 'ethical',
                severity: 'high',
                description: 'Showed flexibility on ethical boundaries'
            });
        }
        
        // Stress concerns
        if (behavior.peakStress === 'high') {
            concerns.push({
                type: 'stress_management',
                severity: 'medium',
                description: 'High stress indicators during assessment'
            });
        }
        
        // Consistency concerns
        if (behavior.anomalyScore > 20) {
            concerns.push({
                type: 'consistency',
                severity: 'medium',
                description: 'Inconsistent behavior patterns detected'
            });
        }
        
        return concerns;
    }
    
    identifyStrengths(responses, behavior) {
        const strengths = [];
        
        // Quick decision making
        if (behavior.averageResponseTime < 8000) {
            strengths.push({
                type: 'decision_speed',
                description: 'Makes quick, confident decisions'
            });
        }
        
        // Ethical integrity
        if (this.calculateEthicalScore(responses) >= 95) {
            strengths.push({
                type: 'integrity',
                description: 'Strong ethical compass'
            });
        }
        
        // Stress resilience
        if (this.calculateStressResilience(behavior) >= 80) {
            strengths.push({
                type: 'resilience',
                description: 'Handles pressure effectively'
            });
        }
        
        return strengths;
    }
    
    calculateFitScore(responses, behavior) {
        let score = 0;
        let weight = 0;
        
        // Ethical integrity (30% weight)
        score += this.calculateEthicalScore(responses) * 0.3;
        weight += 30;
        
        // Stress resilience (25% weight)
        score += this.calculateStressResilience(behavior) * 0.25;
        weight += 25;
        
        // Client focus (20% weight)
        score += this.calculateClientFocus(responses) * 0.2;
        weight += 20;
        
        // Consistency (15% weight)
        const consistencyScore = Math.max(0, 100 - behavior.anomalyScore * 2);
        score += consistencyScore * 0.15;
        weight += 15;
        
        // Adaptability (10% weight)
        score += this.calculateAdaptability(behavior, responses) * 0.1;
        weight += 10;
        
        return Math.round(score);
    }
    
    generateRecommendation(responses, behavior) {
        const fitScore = this.calculateFitScore(responses, behavior);
        const ethicalScore = this.calculateEthicalScore(responses);
        const concerns = this.identifyConcerns(responses, behavior);
        
        if (fitScore >= 85 && ethicalScore >= 90 && concerns.length === 0) {
            return {
                decision: 'strong_hire',
                confidence: 'high',
                summary: 'Excellent candidate with strong ethical foundation and proven resilience'
            };
        } else if (fitScore >= 70 && ethicalScore >= 80 && concerns.filter(c => c.severity === 'high').length === 0) {
            return {
                decision: 'hire',
                confidence: 'medium',
                summary: 'Good candidate with minor areas for development'
            };
        } else if (fitScore >= 60 && ethicalScore >= 70) {
            return {
                decision: 'conditional',
                confidence: 'low',
                summary: 'Potential candidate requiring additional evaluation or training'
            };
        } else {
            return {
                decision: 'no_hire',
                confidence: 'high',
                summary: 'Does not meet minimum requirements for the role'
            };
        }
    }
    
    showCompletionScreen(profile) {
        const container = document.getElementById('assessmentPhase');
        
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 fade-in">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-4">Assessment Complete!</h2>
                    <p class="text-lg text-gray-600 mb-6">Thank you for completing the Northwestern Mutual Elite Advisor Assessment</p>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 class="font-semibold text-gray-900 mb-4">Your Assessment Summary</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="text-sm text-gray-500">Overall Fit Score</span>
                            <div class="text-2xl font-bold text-blue-600">${profile.fitScore}%</div>
                        </div>
                        <div>
                            <span class="text-sm text-gray-500">Completion Time</span>
                            <div class="text-2xl font-bold text-gray-900">${this.formatTime(Date.now() - this.behaviorTracker.startTime)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 class="font-semibold text-blue-900 mb-2">Next Steps</h4>
                    <ul class="text-blue-800 space-y-2">
                        <li class="flex items-start">
                            <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Your assessment results are being analyzed by our team</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>You'll receive a detailed feedback report within 48 hours</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>If selected, we'll contact you to schedule a follow-up interview</span>
                        </li>
                    </ul>
                </div>
                
                <div class="mt-8 text-center">
                    <p class="text-sm text-gray-500">
                        Have questions? Contact our recruitment team at 
                        <a href="mailto:careers@northwesternmutual.com" class="text-blue-600 hover:text-blue-700">careers@northwesternmutual.com</a>
                    </p>
                </div>
            </div>
        `;
        
        // Hide UI elements
        document.getElementById('confidenceMeter').style.display = 'none';
        document.getElementById('stressIndicator').style.display = 'none';
    }
    
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    async submitAssessment(data) {
        try {
            const response = await fetch('http://localhost:8000/api/assessment/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'nm_assessment_key_2024'
                },
                body: JSON.stringify({
                    sessionId: this.behaviorTracker.sessionId,
                    timestamp: Date.now(),
                    data: data
                })
            });
            
            if (!response.ok) {
                console.error('Failed to submit assessment');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
        }
    }
}

// Export for use
window.AdaptiveFlowController = AdaptiveFlowController;
