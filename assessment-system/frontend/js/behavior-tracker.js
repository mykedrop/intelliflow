// js/behavior-tracker.js

class BehaviorTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.data = {
            mouse: {
                movements: [],
                clicks: [],
                hovers: [],
                hesitations: [],
                velocity: [],
                dragEvents: [],
                sliderAdjustments: {}
            },
            keyboard: {
                typingPatterns: {},
                deletions: {},
                pauses: {},
                copyPaste: []
            },
            timing: {
                questionTimes: {},
                totalTime: 0,
                averageResponseTime: 0,
                fastestResponse: Infinity,
                slowestResponse: 0
            },
            navigation: {
                backButtons: 0,
                forwardButtons: 0,
                questionRevisits: {},
                scrollPatterns: [],
                tabSwitches: 0
            },
            confidence: {
                scores: [],
                currentScore: 100,
                lowestPoint: 100,
                volatility: 0
            },
            stress: {
                indicators: [],
                currentLevel: 'low',
                peakLevel: 'low',
                stressEvents: []
            },
            anomalies: {
                rapidClicking: 0,
                erraticMouse: 0,
                unusualPauses: 0,
                inconsistentSpeed: 0,
                rightClickAttempts: 0,
                devToolsOpened: 0,
                timeouts: 0
            }
        };
        
        this.initializeTracking();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeTracking() {
        // Mouse tracking
        this.trackMouseMovements();
        this.trackMouseClicks();
        this.trackMouseHovers();
        
        // Keyboard tracking
        this.trackTypingPatterns();
        
        // Page visibility
        this.trackTabSwitches();
        
        // Scroll tracking
        this.trackScrollPatterns();
        
        // Custom cursor
        this.initCustomCursor();
        
        // Start confidence updates
        this.startConfidenceTracking();
        
        // Start stress detection
        this.startStressDetection();
    }
    
    trackMouseMovements() {
        let lastMove = Date.now();
        let movements = [];
        
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            const timeDelta = now - lastMove;
            
            movements.push({
                x: e.clientX,
                y: e.clientY,
                time: now,
                delta: timeDelta
            });
            
            // Keep only last 100 movements for velocity calculation
            if (movements.length > 100) {
                movements.shift();
            }
            
            // Calculate velocity
            if (movements.length > 2) {
                const velocity = this.calculateVelocity(movements);
                this.data.mouse.velocity.push({
                    speed: velocity,
                    time: now
                });
                
                // Detect hesitation (slow movement near clickable elements)
                if (velocity < 50 && this.nearClickableElement(e.clientX, e.clientY)) {
                    this.data.mouse.hesitations.push({
                        x: e.clientX,
                        y: e.clientY,
                        time: now,
                        element: e.target.tagName
                    });
                }
            }
            
            // Detect erratic movement
            if (this.isErraticMovement(movements)) {
                this.data.anomalies.erraticMouse++;
                this.updateStressLevel('increase');
            }
            
            lastMove = now;
            
            // Store sample of movements (not all, to save memory)
            if (Math.random() < 0.1) { // Store 10% of movements
                this.data.mouse.movements.push({
                    x: e.clientX,
                    y: e.clientY,
                    time: now
                });
            }
        });
    }
    
    trackMouseClicks() {
        let lastClick = 0;
        let clickPattern = [];
        
        document.addEventListener('click', (e) => {
            const now = Date.now();
            const timeSinceLastClick = now - lastClick;
            
            this.data.mouse.clicks.push({
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName,
                targetId: e.target.id,
                targetClass: e.target.className,
                time: now,
                timeSinceLastClick
            });
            
            // Detect rapid clicking (stress indicator)
            clickPattern.push(timeSinceLastClick);
            if (clickPattern.length > 5) {
                clickPattern.shift();
            }
            
            if (this.isRapidClicking(clickPattern)) {
                this.data.anomalies.rapidClicking++;
                this.updateStressLevel('increase');
            }
            
            lastClick = now;
            
            // Visual feedback
            this.animateClick(e.clientX, e.clientY);
        });
    }
    
    trackMouseHovers() {
        let hoverTargets = new Map();
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('option-card') || 
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'INPUT') {
                
                const key = e.target.id || e.target.className;
                if (!hoverTargets.has(key)) {
                    hoverTargets.set(key, {
                        count: 0,
                        totalTime: 0,
                        firstHover: Date.now()
                    });
                }
                
                const hoverData = hoverTargets.get(key);
                hoverData.count++;
                hoverData.lastEnter = Date.now();
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const key = e.target.id || e.target.className;
            if (hoverTargets.has(key)) {
                const hoverData = hoverTargets.get(key);
                if (hoverData.lastEnter) {
                    hoverData.totalTime += Date.now() - hoverData.lastEnter;
                    delete hoverData.lastEnter;
                    
                    // Store hover data
                    this.data.mouse.hovers.push({
                        element: key,
                        count: hoverData.count,
                        totalTime: hoverData.totalTime,
                        time: Date.now()
                    });
                }
            }
        });
    }
    
    trackTypingPatterns() {
        const inputs = ['firstName', 'lastName', 'email', 'phone', 'linkedin'];
        
        inputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (!element) return;
            
            let keystrokes = [];
            let lastKeyTime = 0;
            let deletions = 0;
            let pauses = [];
            
            element.addEventListener('keydown', (e) => {
                const now = Date.now();
                const timeSinceLastKey = now - lastKeyTime;
                
                if (lastKeyTime > 0) {
                    keystrokes.push(timeSinceLastKey);
                    
                    // Detect pauses (> 1 second)
                    if (timeSinceLastKey > 1000) {
                        pauses.push({
                            duration: timeSinceLastKey,
                            position: element.value.length
                        });
                    }
                }
                
                // Track deletions
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    deletions++;
                }
                
                lastKeyTime = now;
            });
            
            // Track copy/paste
            element.addEventListener('paste', (e) => {
                this.data.keyboard.copyPaste.push({
                    field: inputId,
                    time: Date.now(),
                    pastedLength: e.clipboardData.getData('text').length
                });
            });
            
            // Store patterns when field loses focus
            element.addEventListener('blur', () => {
                if (keystrokes.length > 0) {
                    this.data.keyboard.typingPatterns[inputId] = {
                        averageSpeed: this.calculateAverage(keystrokes),
                        totalKeystrokes: keystrokes.length,
                        deletions,
                        pauses,
                        consistency: this.calculateConsistency(keystrokes)
                    };
                    
                    // Update typing analyzer display
                    this.updateTypingAnalyzer(inputId);
                }
            });
        });
    }
    
    trackTabSwitches() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.data.navigation.tabSwitches++;
                this.updateConfidenceScore(-5); // Reduce confidence when switching tabs
                
                // Log the event
                this.data.stress.stressEvents.push({
                    type: 'tab_switch',
                    time: Date.now(),
                    description: 'User switched to another tab'
                });
            }
        });
        
        // Track window blur/focus
        window.addEventListener('blur', () => {
            this.data.navigation.tabSwitches++;
        });
    }
    
    trackScrollPatterns() {
        let scrollEvents = [];
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const now = Date.now();
            const scrollY = window.scrollY;
            const timeSinceLastScroll = now - lastScroll;
            
            scrollEvents.push({
                position: scrollY,
                time: now,
                delta: timeSinceLastScroll,
                direction: scrollY > lastScroll ? 'down' : 'up'
            });
            
            // Detect rapid scrolling (scanning behavior)
            if (scrollEvents.length > 5) {
                const recentScrolls = scrollEvents.slice(-5);
                const isRapid = recentScrolls.every(s => s.delta < 100);
                
                if (isRapid) {
                    this.data.navigation.scrollPatterns.push({
                        type: 'rapid_scanning',
                        time: now
                    });
                }
            }
            
            lastScroll = scrollY;
        });
    }
    
    // Calculation helpers
    calculateVelocity(movements) {
        if (movements.length < 2) return 0;
        
        const recent = movements.slice(-2);
        const distance = Math.sqrt(
            Math.pow(recent[1].x - recent[0].x, 2) + 
            Math.pow(recent[1].y - recent[0].y, 2)
        );
        const time = recent[1].time - recent[0].time;
        
        return time > 0 ? distance / time * 1000 : 0; // pixels per second
    }
    
    nearClickableElement(x, y) {
        const element = document.elementFromPoint(x, y);
        return element && (
            element.tagName === 'BUTTON' || 
            element.tagName === 'INPUT' || 
            element.classList.contains('option-card') ||
            element.closest('button') !== null
        );
    }
    
    isErraticMovement(movements) {
        if (movements.length < 10) return false;
        
        const recent = movements.slice(-10);
        const velocities = [];
        
        for (let i = 1; i < recent.length; i++) {
            velocities.push(this.calculateVelocity([recent[i-1], recent[i]]));
        }
        
        const avgVelocity = this.calculateAverage(velocities);
        const variance = this.calculateVariance(velocities, avgVelocity);
        
        return variance > 10000; // High variance indicates erratic movement
    }
    
    isRapidClicking(pattern) {
        if (pattern.length < 3) return false;
        return pattern.every(interval => interval < 500); // All clicks within 500ms
    }
    
    calculateAverage(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }
    
    calculateVariance(arr, mean) {
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    }
    
    calculateConsistency(keystrokes) {
        if (keystrokes.length < 5) return 100;
        
        const avg = this.calculateAverage(keystrokes);
        const variance = this.calculateVariance(keystrokes, avg);
        
        // Convert variance to consistency score (0-100)
        return Math.max(0, 100 - (variance / 100));
    }
    
    // UI Updates
    initCustomCursor() {
        const cursor = document.getElementById('customCursor');
        
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX - 10 + 'px';
            cursor.style.top = e.clientY - 10 + 'px';
        });
        
        document.addEventListener('mousedown', () => {
            cursor.classList.add('clicking');
        });
        
        document.addEventListener('mouseup', () => {
            cursor.classList.remove('clicking');
        });
    }
    
    animateClick(x, y) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            background: rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
            z-index: 9998;
        `;
        
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
    
    updateTypingAnalyzer(inputId) {
        const analyzer = document.getElementById(inputId + 'Analyzer');
        if (!analyzer) return;
        
        const data = this.data.keyboard.typingPatterns[inputId];
        if (!data) return;
        
        analyzer.innerHTML = `
            <span class="typing-speed">⚡ ${Math.round(60000 / data.averageSpeed)} WPM</span>
            ${data.deletions > 0 ? `<span class="typing-deletions"> | ⌫ ${data.deletions}</span>` : ''}
            ${data.pauses.length > 0 ? `<span class="typing-pauses"> | ⏸ ${data.pauses.length}</span>` : ''}
        `;
    }
    
    // Confidence Tracking
    startConfidenceTracking() {
        setInterval(() => {
            this.calculateConfidenceScore();
            this.updateConfidenceDisplay();
        }, 1000);
    }
    
    calculateConfidenceScore() {
        let score = 100;
        
        // Deduct for tab switches
        score -= this.data.navigation.tabSwitches * 5;
        
        // Deduct for back button usage
        score -= this.data.navigation.backButtons * 3;
        
        // Deduct for hesitations
        score -= Math.min(this.data.mouse.hesitations.length * 2, 20);
        
        // Deduct for anomalies
        score -= this.data.anomalies.rapidClicking * 5;
        score -= this.data.anomalies.erraticMouse * 3;
        
        // Bonus for consistent typing
        const typingScores = Object.values(this.data.keyboard.typingPatterns)
            .map(p => p.consistency || 0);
        if (typingScores.length > 0) {
            const avgConsistency = this.calculateAverage(typingScores);
            score += Math.min(avgConsistency / 10, 10);
        }
        
        // Clamp between 0 and 100
        score = Math.max(0, Math.min(100, score));
        
        this.data.confidence.currentScore = score;
        this.data.confidence.scores.push({
            score,
            time: Date.now()
        });
        
        if (score < this.data.confidence.lowestPoint) {
            this.data.confidence.lowestPoint = score;
        }
        
        return score;
    }
    
    updateConfidenceScore(delta) {
        this.data.confidence.currentScore = Math.max(0, Math.min(100, 
            this.data.confidence.currentScore + delta
        ));
    }
    
    updateConfidenceDisplay() {
        const meter = document.getElementById('confidenceMeter');
        const fill = document.getElementById('confidenceFill');
        const scoreText = document.getElementById('confidenceScore');
        
        if (meter && meter.style.display !== 'none') {
            const score = this.data.confidence.currentScore;
            fill.style.height = score + '%';
            scoreText.textContent = Math.round(score) + '%';
            
            // Color coding
            if (score > 80) {
                fill.style.background = 'linear-gradient(180deg, #28A745 0%, #5B9BD5 100%)';
            } else if (score > 60) {
                fill.style.background = 'linear-gradient(180deg, #FFC107 0%, #5B9BD5 100%)';
            } else {
                fill.style.background = 'linear-gradient(180deg, #DC3545 0%, #5B9BD5 100%)';
            }
        }
    }
    
    // Stress Detection
    startStressDetection() {
        setInterval(() => {
            this.analyzeStressLevel();
            this.updateStressDisplay();
        }, 2000);
    }
    
    analyzeStressLevel() {
        let stressScore = 0;
        
        // Recent rapid clicking
        const recentClicks = this.data.mouse.clicks.filter(
            c => Date.now() - c.time < 5000
        );
        if (recentClicks.length > 10) {
            stressScore += 20;
        }
        
        // Erratic mouse movement
        if (this.data.anomalies.erraticMouse > 3) {
            stressScore += 15;
        }
        
        // Multiple hesitations
        const recentHesitations = this.data.mouse.hesitations.filter(
            h => Date.now() - h.time < 10000
        );
        if (recentHesitations.length > 5) {
            stressScore += 10;
        }
        
        // Tab switching
        if (this.data.navigation.tabSwitches > 2) {
            stressScore += 15;
        }
        
        // Typing patterns (high deletion rate)
        const deletionRates = Object.values(this.data.keyboard.typingPatterns)
            .map(p => p.deletions / Math.max(p.totalKeystrokes, 1));
        if (deletionRates.length > 0) {
            const avgDeletionRate = this.calculateAverage(deletionRates);
            if (avgDeletionRate > 0.2) {
                stressScore += 20;
            }
        }
        
        // Determine stress level
        let level = 'low';
        if (stressScore > 60) {
            level = 'high';
        } else if (stressScore > 30) {
            level = 'medium';
        }
        
        this.data.stress.currentLevel = level;
        this.data.stress.indicators.push({
            level,
            score: stressScore,
            time: Date.now()
        });
        
        if (level === 'high' && this.data.stress.peakLevel !== 'high') {
            this.data.stress.peakLevel = 'high';
        }
    }
    
    updateStressLevel(direction) {
        // Quick stress level adjustment based on events
        const currentIndex = ['low', 'medium', 'high'].indexOf(this.data.stress.currentLevel);
        
        if (direction === 'increase' && currentIndex < 2) {
            this.data.stress.currentLevel = ['low', 'medium', 'high'][currentIndex + 1];
        } else if (direction === 'decrease' && currentIndex > 0) {
            this.data.stress.currentLevel = ['low', 'medium', 'high'][currentIndex - 1];
        }
    }
    
    updateStressDisplay() {
        const indicator = document.getElementById('stressIndicator');
        const dot = document.getElementById('stressDot');
        const label = document.getElementById('stressLabel');
        
        if (indicator && indicator.style.display !== 'none') {
            const level = this.data.stress.currentLevel;
            
            // Update dot color
            dot.className = 'stress-dot';
            if (level === 'medium') {
                dot.classList.add('medium');
            } else if (level === 'high') {
                dot.classList.add('high');
            }
            
            // Update label
            label.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        }
    }
    
    // Question-specific tracking
    startQuestionTracking(questionId) {
        this.data.timing.questionTimes[questionId] = {
            start: Date.now(),
            end: null,
            duration: null,
            changes: [],
            finalAnswer: null
        };
    }
    
    endQuestionTracking(questionId, answer) {
        if (this.data.timing.questionTimes[questionId]) {
            const questionTime = this.data.timing.questionTimes[questionId];
            questionTime.end = Date.now();
            questionTime.duration = questionTime.end - questionTime.start;
            questionTime.finalAnswer = answer;
            
            // Update timing stats
            if (questionTime.duration < this.data.timing.fastestResponse) {
                this.data.timing.fastestResponse = questionTime.duration;
            }
            if (questionTime.duration > this.data.timing.slowestResponse) {
                this.data.timing.slowestResponse = questionTime.duration;
            }
        }
    }
    
    trackAnswerChange(questionId, oldAnswer, newAnswer) {
        if (this.data.timing.questionTimes[questionId]) {
            this.data.timing.questionTimes[questionId].changes.push({
                from: oldAnswer,
                to: newAnswer,
                time: Date.now()
            });
        }
        
        // Update confidence based on answer changes
        this.updateConfidenceScore(-3);
    }
    
    // Export data for analysis
    exportBehaviorData() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            data: this.data,
            summary: this.generateSummary()
        };
    }
    
    generateSummary() {
        return {
            confidenceScore: this.data.confidence.currentScore,
            stressLevel: this.data.stress.currentLevel,
            peakStress: this.data.stress.peakLevel,
            tabSwitches: this.data.navigation.tabSwitches,
            backButtonUsage: this.data.navigation.backButtons,
            averageResponseTime: this.calculateAverageResponseTime(),
            hesitationCount: this.data.mouse.hesitations.length,
            anomalyScore: this.calculateAnomalyScore(),
            typingConsistency: this.calculateOverallTypingConsistency()
        };
    }
    
    calculateAverageResponseTime() {
        const times = Object.values(this.data.timing.questionTimes)
            .filter(t => t.duration)
            .map(t => t.duration);
        
        return times.length > 0 ? this.calculateAverage(times) : 0;
    }
    
    calculateAnomalyScore() {
        return (
            this.data.anomalies.rapidClicking * 3 +
            this.data.anomalies.erraticMouse * 2 +
            this.data.anomalies.unusualPauses * 1 +
            this.data.anomalies.inconsistentSpeed * 2
        );
    }
    
    calculateOverallTypingConsistency() {
        const consistencies = Object.values(this.data.keyboard.typingPatterns)
            .map(p => p.consistency || 0);
        
        return consistencies.length > 0 ? this.calculateAverage(consistencies) : 0;
    }
}

// Initialize tracker when DOM is ready
let behaviorTracker;
document.addEventListener('DOMContentLoaded', () => {
    behaviorTracker = new BehaviorTracker();
});
