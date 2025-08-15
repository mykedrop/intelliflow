// js/assessment-engine.js

class AssessmentEngine {
    constructor() {
        this.initialized = false;
        this.currentQuestion = null;
        this.sessionData = {};
        this.timer = null;
        this.elapsedTime = 0;
    }
    
    async initialize() {
        // Wait for all modules to load
        await this.waitForModules();
        
        // Initialize core components
        this.behaviorTracker = new BehaviorTracker();
        this.questionManager = new QuestionManager();
        this.flowController = new AdaptiveFlowController(this.questionManager, this.behaviorTracker);
        this.analytics = new AnalyticsEngine(this.behaviorTracker, this.questionManager);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start session timer
        this.startTimer();
        
        // Show confidence and stress meters after contact phase
        this.initialized = true;
    }
    
    waitForModules() {
        return new Promise((resolve) => {
            const checkModules = () => {
                if (window.BehaviorTracker && 
                    window.QuestionManager && 
                    window.AdaptiveFlowController && 
                    window.AnalyticsEngine) {
                    resolve();
                } else {
                    setTimeout(checkModules, 100);
                }
            };
            checkModules();
        });
    }
    
    setupEventListeners() {
        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmission();
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentQuestion && this.currentQuestion.type === 'rapid_fire') {
                // Number keys for rapid fire
                if (e.key >= '1' && e.key <= '9') {
                    this.selectRapidOption(parseInt(e.key) - 1);
                }
            }
        });
        
        // Prevent right-click (to discourage copying)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.behaviorTracker.data.anomalies.rightClickAttempts = 
                (this.behaviorTracker.data.anomalies.rightClickAttempts || 0) + 1;
        });
        
        // Detect developer tools (basic detection)
        this.detectDevTools();
    }
    
    handleContactSubmission() {
        // Collect contact data
        this.sessionData.contact = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            linkedin: document.getElementById('linkedin').value,
            experience: document.getElementById('experience').value,
            submittedAt: Date.now()
        };
        
        // Analyze typing patterns from contact form
        const typingAnalysis = this.analyzeContactFormTyping();
        this.sessionData.contactTypingProfile = typingAnalysis;
        
        // Transition to assessment
        this.startAssessment();
    }
    
    analyzeContactFormTyping() {
        const patterns = this.behaviorTracker.data.keyboard.typingPatterns;
        
        return {
            hasTypingData: Object.keys(patterns).length > 0,
            averageConsistency: this.calculateAverageConsistency(patterns),
            copyPasteUsage: this.behaviorTracker.data.keyboard.copyPaste.length,
            hesitationFields: this.identifyHesitationFields(patterns)
        };
    }
    
    calculateAverageConsistency(patterns) {
        const consistencies = Object.values(patterns).map(p => p.consistency || 0);
        return consistencies.length > 0 ? 
            consistencies.reduce((a, b) => a + b, 0) / consistencies.length : 0;
    }
    
    identifyHesitationFields(patterns) {
        return Object.entries(patterns)
            .filter(([field, data]) => data.pauses.length > 2)
            .map(([field]) => field);
    }
    
    startAssessment() {
        // Hide contact form
        document.getElementById('contactPhase').style.display = 'none';
        
        // Show assessment phase
        document.getElementById('assessmentPhase').style.display = 'block';
        
        // Show tracking UI
        document.getElementById('confidenceMeter').style.display = 'block';
        document.getElementById('stressIndicator').style.display = 'block';
        
        // Start with warmup questions
        this.flowController.flowState.phase = 'warmup';
        this.loadNextQuestion();
    }
    
    loadNextQuestion() {
        // Check for flow adaptations
        const adaptations = this.flowController.shouldAdaptFlow();
        if (adaptations.length > 0) {
            this.flowController.applyAdaptations(adaptations);
        }
        
        // Get next question based on current phase and responses
        const question = this.questionManager.getNextQuestion(this.currentQuestion);
        
        if (question) {
            this.currentQuestion = question;
            this.renderQuestion(question);
            
            // Start tracking for this question
            this.behaviorTracker.startQuestionTracking(question.id);
            
            // Update progress
            this.updateProgress();
        } else {
            // No more questions in this phase, transition
            const nextPhase = this.flowController.transitionPhase(this.flowController.flowState.phase);
            
            if (nextPhase && nextPhase !== 'completion') {
                setTimeout(() => this.loadNextQuestion(), 1000);
            }
        }
    }
    
    renderQuestion(question) {
        const container = document.getElementById('assessmentPhase');
        
        switch(question.type) {
            case 'scenario':
            case 'psychological':
                this.renderScenarioQuestion(question, container);
                break;
                
            case 'timed_response':
                this.renderTimedQuestion(question, container);
                break;
                
            case 'email_simulation':
                this.renderEmailSimulation(question, container);
                break;
                
            case 'drag_drop_priority':
                this.renderPriorityMatrix(question, container);
                break;
                
            case 'slider_matrix':
                this.renderSliderMatrix(question, container);
                break;
                
            case 'rapid_fire':
                this.renderRapidFire(question, container);
                break;
                
            case 'day_simulation':
                this.renderDaySimulation(question, container);
                break;
                
            default:
                this.renderScenarioQuestion(question, container);
        }
    }
    
    renderScenarioQuestion(question, container) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-900 mb-3">${question.text}</h2>
                    ${question.subtext ? `<p class="text-gray-600 text-lg">${question.subtext}</p>` : ''}
                </div>
                
                <div class="space-y-4">
                    ${question.options.map((option, index) => `
                        <button class="option-card w-full text-left p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                                onclick="assessmentEngine.selectOption('${question.id}', '${option.value}', ${index})">
                            <div class="flex items-start">
                                <div class="flex-shrink-0 w-6 h-6 border-2 border-gray-300 rounded-full mr-4 mt-1 option-radio"></div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-900 text-lg mb-2">${option.label}</p>
                                    ${option.description ? `<p class="text-gray-600">${option.description}</p>` : ''}
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>
                
                <div class="mt-8 flex justify-end">
                    <button onclick="assessmentEngine.skipQuestion()" class="text-gray-500 hover:text-gray-700 mr-4">
                        Skip Question
                    </button>
                </div>
            </div>
        `;
    }
    
    renderTimedQuestion(question, container) {
        let timeRemaining = question.timeLimit / 1000;
        
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-900">Timed Response</h3>
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="text-2xl font-bold text-red-500" id="timerDisplay">${timeRemaining}</span>
                    </div>
                </div>
                
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-gray-900 mb-3">${question.text}</h2>
                    ${question.subtext ? `<p class="text-gray-600 text-lg">${question.subtext}</p>` : ''}
                </div>
                
                <div class="space-y-4">
                    ${question.options.map((option, index) => `
                        <button class="option-card w-full text-left p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                                onclick="assessmentEngine.selectTimedOption('${question.id}', '${option.value}', ${index})">
                            <div class="flex items-start">
                                <div class="flex-shrink-0 w-6 h-6 border-2 border-gray-300 rounded-full mr-4 mt-1 option-radio"></div>
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-900 text-lg">${option.label}</p>
                                </div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Start countdown
        const timerInterval = setInterval(() => {
            timeRemaining--;
            document.getElementById('timerDisplay').textContent = timeRemaining;
            
            if (timeRemaining <= 5) {
                document.getElementById('timerDisplay').classList.add('animate-pulse');
            }
            
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                this.handleTimeout(question.id);
            }
        }, 1000);
        
        this.currentTimer = timerInterval;
    }
    
    renderEmailSimulation(question, container) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Email Response Simulation</h2>
                
                <div class="bg-gray-50 rounded-xl p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <p class="text-sm text-gray-500">From:</p>
                            <p class="font-semibold">${question.scenario.from}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">Received:</p>
                            <p class="font-semibold text-red-600">${question.scenario.timestamp}</p>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Subject:</p>
                        <p class="font-bold text-lg">${question.scenario.subject}</p>
                    </div>
                    
                    <div class="border-t pt-4">
                        <div class="whitespace-pre-wrap text-gray-700">${question.scenario.body}</div>
                    </div>
                    
                    ${question.scenario.clientProfile ? `
                        <div class="mt-4 pt-4 border-t">
                            <p class="text-sm font-semibold text-gray-600 mb-2">Client Profile:</p>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                ${Object.entries(question.scenario.clientProfile).map(([key, value]) => `
                                    <div><span class="text-gray-500">${key}:</span> <span class="font-medium">${value}</span></div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Your Response:</label>
                    <textarea id="emailResponse" 
                              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows="8"
                              placeholder="Type your email response here..."></textarea>
                    
                    <div class="flex items-center justify-between mt-4">
                        <div class="text-sm text-gray-500">
                            <span id="wordCount">0</span> words | 
                            <span id="charCount">0</span> characters
                        </div>
                        <button onclick="assessmentEngine.submitEmailResponse('${question.id}')" 
                                class="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold">
                            Send Response →
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Track typing
        const textarea = document.getElementById('emailResponse');
        textarea.addEventListener('input', () => {
            const text = textarea.value;
            document.getElementById('wordCount').textContent = text.split(/\s+/).filter(w => w.length > 0).length;
            document.getElementById('charCount').textContent = text.length;
        });
    }
    
    renderPriorityMatrix(question, container) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                <h2 class="text-2xl font-bold text-gray-900 mb-3">${question.scenario.context}</h2>
                <p class="text-gray-600 mb-6">${question.scenario.instruction}</p>
                
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-4">Available Tasks</h3>
                        <div id="availableTasks" class="space-y-3">
                            ${question.scenario.items.map(item => `
                                <div class="priority-item bg-gray-50 p-4 rounded-lg border-2 border-gray-200" 
                                     draggable="true" 
                                     data-id="${item.id}"
                                     ondragstart="assessmentEngine.handleDragStart(event)"
                                     ondragend="assessmentEngine.handleDragEnd(event)">
                                    <h4 class="font-semibold text-gray-900">${item.title}</h4>
                                    <p class="text-sm text-gray-600 mt-1">${item.details}</p>
                                    <div class="flex gap-2 mt-2">
                                        <span class="text-xs px-2 py-1 rounded ${item.urgency === 'high' ? 'bg-red-100 text-red-700' : item.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}">
                                            ${item.urgency} urgency
                                        </span>
                                        <span class="text-xs px-2 py-1 rounded ${item.importance === 'high' ? 'bg-blue-100 text-blue-700' : item.importance === 'medium' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                                            ${item.importance} importance
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="font-semibold text-gray-700 mb-4">Your Priority Order</h3>
                        <div id="priorityOrder" 
                             class="min-h-[400px] bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 space-y-3"
                             ondragover="assessmentEngine.handleDragOver(event)"
                             ondrop="assessmentEngine.handleDrop(event)">
                            <p class="text-gray-500 text-center mt-8">Drag tasks here in order of priority</p>
                        </div>
                        
                        <button onclick="assessmentEngine.submitPriorityOrder('${question.id}')" 
                                class="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold">
                            Submit Priority Order →
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSliderMatrix(question, container) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                <h2 class="text-2xl font-bold text-gray-900 mb-3">${question.text}</h2>
                <p class="text-gray-600 mb-8">${question.subtext}</p>
                
                <div class="space-y-8">
                    ${question.dimensions.map(dimension => `
                        <div class="slider-dimension" data-id="${dimension.id}">
                            <div class="flex justify-between mb-2">
                                <div class="text-left">
                                    <p class="font-semibold text-gray-900">${dimension.left}</p>
                                    <p class="text-sm text-gray-500">${dimension.leftDescription}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold text-gray-900">${dimension.right}</p>
                                    <p class="text-sm text-gray-500">${dimension.rightDescription}</p>
                                </div>
                            </div>
                            
                            <div class="relative">
                                <input type="range" 
                                       id="slider_${dimension.id}" 
                                       min="0" 
                                       max="100" 
                                       value="50" 
                                       class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                       oninput="assessmentEngine.handleSliderChange('${dimension.id}', this.value)">
                                <div class="flex justify-between mt-2">
                                    <span class="text-xs text-gray-400">0</span>
                                    <span class="text-xs text-gray-400">25</span>
                                    <span class="text-xs text-gray-400">50</span>
                                    <span class="text-xs text-gray-400">75</span>
                                    <span class="text-xs text-gray-400">100</span>
                                </div>
                                <div class="text-center mt-2">
                                    <span class="text-sm font-semibold text-blue-600" id="value_${dimension.id}">50</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button onclick="assessmentEngine.submitSliderMatrix('${question.id}')" 
                        class="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-8 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold">
                    Continue →
                </button>
            </div>
        `;
        
        // Add custom slider styling
        const style = document.createElement('style');
        style.textContent = `
            .slider::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                background: #3B82F6;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #3B82F6;
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    renderRapidFire(question, container) {
        let currentQuestionIndex = 0;
        const responses = [];
        
        const renderRapidQuestion = () => {
            if (currentQuestionIndex >= question.questions.length) {
                this.submitRapidFireResponses(question.id, responses);
                return;
            }
            
            const currentQ = question.questions[currentQuestionIndex];
            let timeRemaining = question.timePerQuestion / 1000;
            
            container.innerHTML = `
                <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">Rapid Fire Round</h3>
                            <div class="flex items-center">
                                <span class="text-sm text-gray-500 mr-4">Question ${currentQuestionIndex + 1} of ${question.questions.length}</span>
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span class="text-2xl font-bold text-red-500" id="rapidTimer">${timeRemaining}</span>
                                </div>
                            </div>
                        </div>
                        
                        <h2 class="text-3xl font-bold text-gray-900 text-center mb-8">${currentQ.text}</h2>
                        
                        <div class="grid grid-cols-2 gap-4">
                            ${currentQ.options.map((option, index) => `
                                <button onclick="assessmentEngine.selectRapidOption(${index})" 
                                        class="p-6 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-xl transition-all duration-200">
                                    <span class="text-xl font-semibold">${index + 1}. ${option}</span>
                                </button>
                            `).join('')}
                        </div>
                        
                        <p class="text-center text-gray-500 mt-6">Press 1 or 2 on your keyboard for faster response</p>
                    </div>
                </div>
            `;
            
            // Timer
            const timerInterval = setInterval(() => {
                timeRemaining--;
                const timerElement = document.getElementById('rapidTimer');
                if (timerElement) {
                    timerElement.textContent = timeRemaining;
                    
                    if (timeRemaining <= 1) {
                        timerElement.classList.add('animate-pulse');
                    }
                }
                
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    responses.push({
                        question: currentQ.text,
                        answer: null,
                        timeout: true,
                        responseTime: question.timePerQuestion
                    });
                    currentQuestionIndex++;
                    renderRapidQuestion();
                }
            }, 1000);
            
            this.currentRapidTimer = timerInterval;
            this.currentRapidData = {
                startTime: Date.now(),
                question: currentQ,
                responses,
                currentQuestionIndex,
                renderNext: renderRapidQuestion
            };
        };
        
        renderRapidQuestion();
    }
    
    selectRapidOption(optionIndex) {
        if (!this.currentRapidData) return;
        
        const responseTime = Date.now() - this.currentRapidData.startTime;
        const question = this.currentRapidData.question;
        
        this.currentRapidData.responses.push({
            question: question.text,
            answer: question.options[optionIndex],
            responseTime,
            optionIndex
        });
        
        // Clear timer
        if (this.currentRapidTimer) {
            clearInterval(this.currentRapidTimer);
        }
        
        // Move to next question
        this.currentRapidData.currentQuestionIndex++;
        this.currentRapidData.renderNext();
    }
    
    renderDaySimulation(question, container) {
        // Implementation of day simulation rendering
        // This would be a complex multi-step interface
        window.startDaySimulation = () => {
            this.runDaySimulation(question);
        };
    }
    
    // Event handlers
    selectOption(questionId, value, index) {
        // Record response
        this.questionManager.recordResponse(questionId, value, {
            optionIndex: index,
            responseTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[questionId].start
        });
        
        // End tracking for this question
        this.behaviorTracker.endQuestionTracking(questionId, value);
        
        // Visual feedback
        this.highlightSelectedOption(index);
        
        // Load next question after delay
        setTimeout(() => this.loadNextQuestion(), 1000);
    }
    
    selectTimedOption(questionId, value, index) {
        // Clear timer
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
        }
        
        // Record response with timing data
        this.questionManager.recordResponse(questionId, value, {
            optionIndex: index,
            responseTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[questionId].start,
            timedResponse: true
        });
        
        // End tracking
        this.behaviorTracker.endQuestionTracking(questionId, value);
        
        // Visual feedback
        this.highlightSelectedOption(index);
        
        // Load next question
        setTimeout(() => this.loadNextQuestion(), 1000);
    }
    
    handleTimeout(questionId) {
        // Record timeout
        this.questionManager.recordResponse(questionId, null, {
            timeout: true,
            responseTime: this.currentQuestion.timeLimit
        });
        
        // Update behavior tracking
        this.behaviorTracker.data.anomalies.timeouts = 
            (this.behaviorTracker.data.anomalies.timeouts || 0) + 1;
        
        // Load next question
        this.loadNextQuestion();
    }
    
    submitEmailResponse(questionId) {
        const response = document.getElementById('emailResponse').value;
        
        // Analyze email response
        const analysis = this.analyzeEmailResponse(response);
        
        // Record response
        this.questionManager.recordResponse(questionId, response, {
            wordCount: analysis.wordCount,
            sentiment: analysis.sentiment,
            professionalScore: analysis.professionalScore,
            responseTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[questionId].start
        });
        
        // End tracking
        this.behaviorTracker.endQuestionTracking(questionId, response);
        
        // Load next question
        this.loadNextQuestion();
    }
    
    analyzeEmailResponse(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        
        return {
            wordCount: words.length,
            sentiment: this.analyzeSentiment(text),
            professionalScore: this.calculateProfessionalScore(text),
            hasGreeting: /^(dear|hi|hello|good)/i.test(text),
            hasClosing: /(sincerely|regards|best|thanks)/i.test(text),
            urgencyLevel: this.detectUrgency(text)
        };
    }
    
    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positive = ['pleased', 'happy', 'glad', 'excellent', 'great', 'wonderful', 'confident'];
        const negative = ['concerned', 'worried', 'upset', 'disappointed', 'frustrated', 'angry'];
        
        const lowerText = text.toLowerCase();
        let score = 0;
        
        positive.forEach(word => {
            if (lowerText.includes(word)) score++;
        });
        
        negative.forEach(word => {
            if (lowerText.includes(word)) score--;
        });
        
        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }
    
    calculateProfessionalScore(text) {
        let score = 70; // Base score
        
        // Check for professional elements
        if (/^(dear|hello) (mr\.|mrs\.|ms\.|dr\.)/i.test(text)) score += 10;
        if (/(sincerely|best regards|respectfully)/i.test(text)) score += 10;
        if (text.length > 100 && text.length < 500) score += 10; // Appropriate length
        
        // Deduct for unprofessional elements
        if (/!!!|\.\.\.{3,}/g.test(text)) score -= 10; // Excessive punctuation
        if (/\b(ur|u|thx|plz)\b/i.test(text)) score -= 20; // Text speak
        
        return Math.max(0, Math.min(100, score));
    }
    
    detectUrgency(text) {
        const urgentWords = ['urgent', 'asap', 'immediately', 'right away', 'emergency'];
        const calmWords = ['when you can', 'no rush', 'at your convenience', 'when possible'];
        
        const lowerText = text.toLowerCase();
        
        if (urgentWords.some(word => lowerText.includes(word))) return 'high';
        if (calmWords.some(word => lowerText.includes(word))) return 'low';
        return 'medium';
    }
    
    // Drag and drop handlers
    handleDragStart(e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
        e.dataTransfer.setData('itemId', e.target.dataset.id);
        e.target.classList.add('dragging');
        
        // Track drag start
        this.behaviorTracker.data.mouse.dragEvents = 
            (this.behaviorTracker.data.mouse.dragEvents || []);
        this.behaviorTracker.data.mouse.dragEvents.push({
            type: 'start',
            itemId: e.target.dataset.id,
            time: Date.now()
        });
    }
    
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        const itemId = e.dataTransfer.getData('itemId');
        const draggedElement = document.querySelector(`[data-id="${itemId}"]`);
        
        if (draggedElement && e.target.id === 'priorityOrder') {
            e.target.appendChild(draggedElement);
            
            // Remove placeholder text if this is the first item
            const placeholder = e.target.querySelector('.text-gray-500');
            if (placeholder) {
                placeholder.remove();
            }
        }
        
        return false;
    }
    
    submitPriorityOrder(questionId) {
        const orderContainer = document.getElementById('priorityOrder');
        const items = orderContainer.querySelectorAll('.priority-item');
        
        const order = Array.from(items).map((item, index) => ({
            id: item.dataset.id,
            position: index + 1
        }));
        
        // Record response
        this.questionManager.recordResponse(questionId, order, {
            itemCount: order.length,
            responseTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[questionId].start
        });
        
        // End tracking
        this.behaviorTracker.endQuestionTracking(questionId, order);
        
        // Load next question
        this.loadNextQuestion();
    }
    
    handleSliderChange(dimensionId, value) {
        // Update display
        document.getElementById(`value_${dimensionId}`).textContent = value;
        
        // Track micro-adjustments
        this.behaviorTracker.data.mouse.sliderAdjustments = 
            (this.behaviorTracker.data.mouse.sliderAdjustments || {});
        
        if (!this.behaviorTracker.data.mouse.sliderAdjustments[dimensionId]) {
            this.behaviorTracker.data.mouse.sliderAdjustments[dimensionId] = [];
        }
        
        this.behaviorTracker.data.mouse.sliderAdjustments[dimensionId].push({
            value,
            time: Date.now()
        });
    }
    
    submitSliderMatrix(questionId) {
        const dimensions = this.currentQuestion.dimensions;
        const values = {};
        
        dimensions.forEach(dimension => {
            values[dimension.id] = parseInt(document.getElementById(`slider_${dimension.id}`).value);
        });
        
        // Analyze slider patterns
        const analysis = this.analyzeSliderPatterns(values);
        
        // Record response
        this.questionManager.recordResponse(questionId, values, {
            analysis,
            responseTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[questionId].start
        });
        
        // End tracking
        this.behaviorTracker.endQuestionTracking(questionId, values);
        
        // Load next question
        this.loadNextQuestion();
    }
    
    analyzeSliderPatterns(values) {
        const positions = Object.values(values);
        
        return {
            average: positions.reduce((a, b) => a + b, 0) / positions.length,
            variance: this.calculateVariance(positions),
            extremePositions: positions.filter(p => p < 20 || p > 80).length,
            centerTendency: positions.filter(p => p >= 40 && p <= 60).length,
            consistency: this.calculateSliderConsistency(values)
        };
    }
    
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }
    
    calculateSliderConsistency(values) {
        // Check if slider positions align with expected patterns
        let consistencyScore = 100;
        
        // Example: If someone is process-driven but also highly adaptive, that might be inconsistent
        if (values['process_intuition'] < 30 && values['planner_adapter'] > 70) {
            consistencyScore -= 20;
        }
        
        return consistencyScore;
    }
    
    submitRapidFireResponses(questionId, responses) {
        // Analyze rapid fire patterns
        const analysis = {
            averageResponseTime: responses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / responses.length,
            timeouts: responses.filter(r => r.timeout).length,
            consistency: this.analyzeRapidFireConsistency(responses),
            decisionPattern: this.identifyDecisionPattern(responses)
        };
        
        // Record response
        this.questionManager.recordResponse(questionId, responses, {
            analysis,
            totalTime: responses.reduce((sum, r) => sum + (r.responseTime || 0), 0)
        });
        
        // Load next question
        this.loadNextQuestion();
    }
    
    analyzeRapidFireConsistency(responses) {
        // Look for patterns in rapid responses
        return {
            allFirstOption: responses.every(r => r.optionIndex === 0),
            allSecondOption: responses.every(r => r.optionIndex === 1),
            alternating: this.isAlternatingPattern(responses),
            randomness: this.calculateResponseRandomness(responses)
        };
    }
    
    isAlternatingPattern(responses) {
        for (let i = 1; i < responses.length; i++) {
            if (responses[i].optionIndex === responses[i-1].optionIndex) {
                return false;
            }
        }
        return true;
    }
    
    calculateResponseRandomness(responses) {
        // Calculate entropy of responses
        const counts = {};
        responses.forEach(r => {
            if (r.optionIndex !== undefined) {
                counts[r.optionIndex] = (counts[r.optionIndex] || 0) + 1;
            }
        });
        
        const total = responses.length;
        let entropy = 0;
        
        Object.values(counts).forEach(count => {
            const p = count / total;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });
        
        return entropy;
    }
    
    identifyDecisionPattern(responses) {
        const fastDecisions = responses.filter(r => r.responseTime < 1000).length;
        const slowDecisions = responses.filter(r => r.responseTime > 2500).length;
        
        if (fastDecisions > responses.length * 0.7) return 'impulsive';
        if (slowDecisions > responses.length * 0.5) return 'deliberative';
        return 'balanced';
    }
    
    // UI helpers
    highlightSelectedOption(index) {
        const options = document.querySelectorAll('.option-card');
        options.forEach((option, i) => {
            if (i === index) {
                option.classList.add('selected');
                option.querySelector('.option-radio').innerHTML = 
                    '<div class="w-2 h-2 bg-blue-600 rounded-full"></div>';
            }
        });
    }
    
    skipQuestion() {
        // Record skip
        this.questionManager.recordResponse(this.currentQuestion.id, null, {
            skipped: true,
            responseTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[this.currentQuestion.id].start
        });
        
        // Update behavior tracking
        this.behaviorTracker.data.navigation.skippedQuestions = 
            (this.behaviorTracker.data.navigation.skippedQuestions || 0) + 1;
        
        // Load next question
        this.loadNextQuestion();
    }
    
    updateProgress() {
        const progress = this.questionManager.getAssessmentProgress();
        
        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress.percentage}%`;
        }
        
        // Update progress text
        const progressText = document.getElementById('progressPercentage');
        if (progressText) {
            progressText.textContent = `${Math.round(progress.percentage)}%`;
        }
        
        // Update question counter
        const counter = document.getElementById('questionCounter');
        if (counter) {
            counter.textContent = `Question ${progress.completed} of ${progress.total}`;
        }
    }
    
    // Timer management
    startTimer() {
        this.timer = setInterval(() => {
            this.elapsedTime++;
            this.updateTimerDisplay();
        }, 1000);
    }
    
    updateTimerDisplay() {
        const timer = document.getElementById('sessionTimer');
        if (timer) {
            const minutes = Math.floor(this.elapsedTime / 60);
            const seconds = this.elapsedTime % 60;
            timer.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // Dev tools detection
    detectDevTools() {
        let devtools = { open: false, orientation: null };
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.behaviorTracker.data.anomalies.devToolsOpened = 
                        (this.behaviorTracker.data.anomalies.devToolsOpened || 0) + 1;
                    
                    console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 30px;');
                    console.log('%cYour session is being monitored for assessment integrity', 'color: orange; font-size: 16px;');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }
    
    // Day simulation
    runDaySimulation(question) {
        let currentEventIndex = 0;
        const simulationResponses = [];
        
        const renderEvent = () => {
            if (currentEventIndex >= question.scenario.events.length) {
                this.completeDaySimulation(question.id, simulationResponses);
                return;
            }
            
            const event = question.scenario.events[currentEventIndex];
            const container = document.getElementById('assessmentPhase');
            
            container.innerHTML = `
                <div class="bg-white rounded-2xl shadow-lg p-10 question-card">
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-2xl font-bold text-gray-900">Day Simulation</h3>
                            <div class="text-lg font-semibold text-blue-600">${event.time}</div>
                        </div>
                        
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                            <h4 class="font-semibold text-gray-900 mb-2">${event.event}</h4>
                            <p class="text-gray-700">${event.decision.text}</p>
                        </div>
                        
                        <div class="space-y-3">
                            ${event.decision.options.map((option, index) => `
                                <button onclick="assessmentEngine.selectSimulationOption(${currentEventIndex}, ${index})" 
                                        class="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                                    <span class="font-medium">${option}</span>
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="mt-6 flex justify-between text-sm text-gray-500">
                            <span>Event ${currentEventIndex + 1} of ${question.scenario.events.length}</span>
                            <span>${question.scenario.events.length - currentEventIndex - 1} decisions remaining</span>
                        </div>
                    </div>
                </div>
            `;
        };
        
        this.currentSimulation = {
            responses: simulationResponses,
            currentEventIndex,
            renderEvent,
            events: question.scenario.events
        };
        
        renderEvent();
    }
    
    selectSimulationOption(eventIndex, optionIndex) {
        const event = this.currentSimulation.events[eventIndex];
        
        this.currentSimulation.responses.push({
            time: event.time,
            event: event.event,
            decision: event.decision.options[optionIndex],
            optionIndex,
            timestamp: Date.now()
        });
        
        // Move to next event
        this.currentSimulation.currentEventIndex++;
        this.currentSimulation.renderEvent();
    }
    
    completeDaySimulation(questionId, responses) {
        // Analyze day simulation
        const analysis = this.analyzeDaySimulation(responses);
        
        // Record response
        this.questionManager.recordResponse(questionId, responses, {
            analysis,
            totalTime: Date.now() - this.behaviorTracker.data.timing.questionTimes[questionId].start
        });
        
        // End tracking
        this.behaviorTracker.endQuestionTracking(questionId, responses);
        
        // Load next question or complete
        this.loadNextQuestion();
    }
    
    analyzeDaySimulation(responses) {
        const scoring = {
            workLifeBalance: 0,
            clientFirst: 0,
            teamPlayer: 0,
            ethical: 0,
            efficiency: 0,
            stressManagement: 0
        };
        
        // Score based on responses
        responses.forEach(response => {
            // Example scoring logic (customize based on your criteria)
            if (response.decision.includes('client')) {
                scoring.clientFirst += 10;
            }
            if (response.decision.includes('team') || response.decision.includes('colleague')) {
                scoring.teamPlayer += 10;
            }
            if (response.decision.includes('family') || response.decision.includes('tomorrow')) {
                scoring.workLifeBalance += 10;
            }
        });
        
        return scoring;
    }
}

// Initialize assessment when DOM is ready
let assessmentEngine;
document.addEventListener('DOMContentLoaded', async () => {
    assessmentEngine = new AssessmentEngine();
    await assessmentEngine.initialize();
});
