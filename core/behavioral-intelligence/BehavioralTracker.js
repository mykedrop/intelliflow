class BehavioralTracker {
    constructor(sessionId) {
        this.session = {
            id: sessionId || this.generateSessionId(),
            startTime: Date.now(),
            events: [],
            mouseMovements: [],
            keystrokes: [],
            scrollEvents: [],
            focusEvents: [],
            hesitations: [],
            corrections: [],
            fieldInteractions: [],
            device: this.getDeviceProfile()
        };
        this.currentQuestion = null;
        this.questionTimings = [];
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getDeviceProfile() {
        if (typeof window === 'undefined') {
            return { type: 'server', environment: 'node' };
        }
        
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen?.width,
            screenHeight: window.screen?.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            touchPoints: navigator.maxTouchPoints,
            type: this.detectDeviceType()
        };
    }

    detectDeviceType() {
        if (typeof window === 'undefined') return 'server';
        
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    startTracking() {
        if (typeof window === 'undefined') return;
        
        this.trackMouseMovements();
        this.trackKeystrokes();
        this.trackScrollBehavior();
        this.trackFocusEvents();
        this.trackVisibility();
        this.trackRageClicks();
        this.trackFormInteractions();
        this.trackCopyPaste();
        this.trackNetworkSpeed();
    }

    trackMouseMovements() {
        let lastMove = Date.now();
        let movements = [];
        let heatmapData = {};

        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMove > 100) { // Throttle to 10fps
                const point = {
                    x: e.clientX,
                    y: e.clientY,
                    t: now - this.session.startTime
                };
                
                movements.push(point);
                
                // Update heatmap
                const gridX = Math.floor(e.clientX / 50);
                const gridY = Math.floor(e.clientY / 50);
                const key = `${gridX},${gridY}`;
                heatmapData[key] = (heatmapData[key] || 0) + 1;
                
                // Keep only last 200 movements
                if (movements.length > 200) {
                    movements = movements.slice(-200);
                }
                
                this.session.mouseMovements = movements;
                this.session.heatmap = heatmapData;
                lastMove = now;
            }
        });
        
        // Track mouse velocity for engagement analysis
        this.trackMouseVelocity();
    }

    trackMouseVelocity() {
        let lastX = 0, lastY = 0, lastTime = Date.now();
        let velocities = [];
        
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            const timeDelta = now - lastTime;
            
            if (timeDelta > 50) { // Sample every 50ms
                const distance = Math.sqrt(
                    Math.pow(e.clientX - lastX, 2) + 
                    Math.pow(e.clientY - lastY, 2)
                );
                const velocity = distance / timeDelta;
                
                velocities.push({
                    v: velocity,
                    t: now - this.session.startTime
                });
                
                // Keep only last 100 velocities
                if (velocities.length > 100) {
                    velocities = velocities.slice(-100);
                }
                
                this.session.mouseVelocities = velocities;
                
                lastX = e.clientX;
                lastY = e.clientY;
                lastTime = now;
            }
        });
    }

    trackKeystrokes() {
        let lastKeyTime = Date.now();
        let keystrokeTimings = [];
        let typingPatterns = {
            bursts: 0,
            pauses: 0,
            corrections: 0
        };

        document.addEventListener('keydown', (e) => {
            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTime;
            
            // Track typing cadence
            if (timeSinceLastKey < 10000) {
                keystrokeTimings.push(timeSinceLastKey);
                
                // Detect typing patterns
                if (timeSinceLastKey < 200) typingPatterns.bursts++;
                else if (timeSinceLastKey > 2000) typingPatterns.pauses++;
            }
            
            // Track corrections
            if (e.key === 'Backspace' || e.key === 'Delete') {
                typingPatterns.corrections++;
                this.session.corrections.push({
                    time: now - this.session.startTime,
                    field: e.target?.name || e.target?.id
                });
            }
            
            // Track special keys
            if (e.key === 'Tab') {
                this.session.events.push({
                    type: 'tab_navigation',
                    time: now - this.session.startTime
                });
            }
            
            lastKeyTime = now;
        });
        
        this.session.typingPatterns = typingPatterns;
        this.session.keystrokeTimings = keystrokeTimings;
    }

    trackScrollBehavior() {
        let maxScroll = 0;
        let scrollEvents = [];
        let scrollReturns = 0;
        let lastScrollTop = 0;

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            
            // Track scroll returns (going back up)
            if (scrollTop < lastScrollTop - 100) {
                scrollReturns++;
            }
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            scrollEvents.push({
                percent: scrollPercent,
                direction: scrollTop > lastScrollTop ? 'down' : 'up',
                time: Date.now() - this.session.startTime
            });
            
            // Keep only last 100 scroll events
            if (scrollEvents.length > 100) {
                scrollEvents = scrollEvents.slice(-100);
            }
            
            this.session.scrollEvents = scrollEvents;
            this.session.maxScrollDepth = maxScroll;
            this.session.scrollReturns = scrollReturns;
            
            lastScrollTop = scrollTop;
        };
        
        // Throttled scroll handler
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 100);
        });
    }

    trackFocusEvents() {
        let lastFocusTime = Date.now();
        let totalFocusTime = 0;
        let tabSwitches = 0;

        document.addEventListener('focus', (e) => {
            const now = Date.now();
            
            this.session.focusEvents.push({
                type: 'focus',
                target: e.target?.name || e.target?.id,
                time: now - this.session.startTime
            });
            
            lastFocusTime = now;
        }, true);

        document.addEventListener('blur', (e) => {
            const now = Date.now();
            const focusDuration = now - lastFocusTime;
            
            totalFocusTime += focusDuration;
            
            this.session.focusEvents.push({
                type: 'blur',
                target: e.target?.name || e.target?.id,
                time: now - this.session.startTime,
                duration: focusDuration
            });
            
            this.session.totalFocusTime = totalFocusTime;
        }, true);
        
        // Track tab switches
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                tabSwitches++;
                this.session.tabSwitches = tabSwitches;
            }
        });
    }

    trackVisibility() {
        let hiddenTime = 0;
        let lastHidden = null;
        let visibilityChanges = 0;

        document.addEventListener('visibilitychange', () => {
            const now = Date.now();
            visibilityChanges++;
            
            if (document.hidden) {
                lastHidden = now;
                this.session.events.push({
                    type: 'page_hidden',
                    time: now - this.session.startTime
                });
            } else if (lastHidden) {
                const hiddenDuration = now - lastHidden;
                hiddenTime += hiddenDuration;
                
                this.session.totalHiddenTime = hiddenTime;
                this.session.visibilityChanges = visibilityChanges;
                
                this.session.events.push({
                    type: 'page_visible',
                    time: now - this.session.startTime,
                    hiddenDuration
                });
            }
        });
    }

    trackRageClicks() {
        let clicks = [];
        let rageClicks = 0;
        let deadClicks = 0;

        document.addEventListener('click', (e) => {
            const now = Date.now();
            const click = {
                time: now,
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName
            };
            
            clicks.push(click);
            
            // Check for rage clicks (3+ clicks within 1 second in same area)
            const recentClicks = clicks.filter(c => now - c.time < 1000);
            
            if (recentClicks.length >= 3) {
                const avgX = recentClicks.reduce((sum, c) => sum + c.x, 0) / recentClicks.length;
                const avgY = recentClicks.reduce((sum, c) => sum + c.y, 0) / recentClicks.length;
                
                const isRageClick = recentClicks.every(c => 
                    Math.abs(c.x - avgX) < 50 && Math.abs(c.y - avgY) < 50
                );
                
                if (isRageClick) {
                    rageClicks++;
                    this.session.rageClicks = rageClicks;
                    
                    this.session.events.push({
                        type: 'rage_click',
                        time: now - this.session.startTime,
                        location: { x: avgX, y: avgY },
                        count: recentClicks.length
                    });
                }
            }
            
            // Check for dead clicks (clicks on non-interactive elements)
            if (!e.target.onclick && 
                !e.target.href && 
                e.target.tagName !== 'BUTTON' && 
                e.target.tagName !== 'A' &&
                e.target.tagName !== 'INPUT') {
                deadClicks++;
                this.session.deadClicks = deadClicks;
            }
            
            // Clean old clicks
            clicks = clicks.filter(c => now - c.time < 5000);
        });
    }

    trackFormInteractions() {
        const formFields = document.querySelectorAll('input, select, textarea');
        
        formFields.forEach(field => {
            let startTime = null;
            let changeCount = 0;
            let previousValue = '';

            field.addEventListener('focus', () => {
                startTime = Date.now();
                previousValue = field.value;
            });

            field.addEventListener('blur', () => {
                if (startTime) {
                    const duration = Date.now() - startTime;
                    const changed = field.value !== previousValue;
                    
                    this.session.fieldInteractions.push({
                        field: field.name || field.id,
                        type: field.type,
                        duration,
                        changed,
                        changeCount,
                        completed: !!field.value,
                        time: Date.now() - this.session.startTime
                    });
                    
                    // Detect hesitation
                    if (duration > 10000) {
                        this.session.hesitations.push({
                            field: field.name || field.id,
                            duration,
                            time: Date.now() - this.session.startTime
                        });
                    }
                }
            });

            field.addEventListener('input', () => {
                changeCount++;
            });
        });
    }

    trackCopyPaste() {
        let copyEvents = 0;
        let pasteEvents = 0;
        
        document.addEventListener('copy', () => {
            copyEvents++;
            this.session.copyEvents = copyEvents;
        });
        
        document.addEventListener('paste', (e) => {
            pasteEvents++;
            this.session.pasteEvents = pasteEvents;
            
            this.session.events.push({
                type: 'paste',
                field: e.target?.name || e.target?.id,
                time: Date.now() - this.session.startTime
            });
        });
    }

    trackNetworkSpeed() {
        if (typeof navigator !== 'undefined' && navigator.connection) {
            this.session.networkInfo = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
    }

    trackQuestionStart(questionId) {
        this.currentQuestion = {
            id: questionId,
            startTime: Date.now()
        };
    }

    trackQuestionComplete(questionId, answer) {
        if (this.currentQuestion && this.currentQuestion.id === questionId) {
            const duration = Date.now() - this.currentQuestion.startTime;
            
            this.questionTimings.push({
                questionId,
                answer,
                duration,
                time: Date.now() - this.session.startTime
            });
            
            this.session.events.push({
                type: 'question_completed',
                questionId,
                duration
            });
            
            return duration;
        }
        return null;
    }

    getSessionData() {
        const now = Date.now();
        const totalTime = now - this.session.startTime;
        
        return {
            ...this.session,
            totalTime,
            questionTimings: this.questionTimings,
            averageQuestionTime: this.calculateAverageQuestionTime(),
            completionRate: this.calculateCompletionRate(),
            engagementScore: this.calculateEngagement(),
            trustSignals: this.identifyTrustSignals(),
            riskSignals: this.identifyRiskSignals(),
            behaviorProfile: this.generateBehaviorProfile()
        };
    }

    calculateAverageQuestionTime() {
        if (this.questionTimings.length === 0) return 0;
        
        const total = this.questionTimings.reduce((sum, q) => sum + q.duration, 0);
        return Math.round(total / this.questionTimings.length);
    }

    calculateCompletionRate() {
        const totalFields = document.querySelectorAll('input, select, textarea').length;
        const completedFields = Array.from(document.querySelectorAll('input, select, textarea'))
            .filter(field => field.value).length;
        
        return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    }

    calculateEngagement() {
        const factors = {
            timeOnPage: Math.min((Date.now() - this.session.startTime) / 60000, 1),
            scrollDepth: (this.session.maxScrollDepth || 0) / 100,
            interactions: Math.min((this.session.events?.length || 0) / 20, 1),
            focusTime: this.session.totalFocusTime ? 
                Math.min(this.session.totalFocusTime / (Date.now() - this.session.startTime), 1) : 0.5,
            mouseActivity: Math.min((this.session.mouseMovements?.length || 0) / 100, 1)
        };
        
        const weights = {
            timeOnPage: 0.20,
            scrollDepth: 0.20,
            interactions: 0.20,
            focusTime: 0.20,
            mouseActivity: 0.20
        };
        
        let engagement = 0;
        Object.entries(factors).forEach(([factor, value]) => {
            engagement += value * weights[factor];
        });
        
        return Math.round(engagement * 100);
    }

    identifyTrustSignals() {
        const signals = [];
        
        if (this.session.corrections && this.session.corrections.length < 3) {
            signals.push('low_corrections');
        }
        
        if (this.calculateAverageQuestionTime() > 3000 && 
            this.calculateAverageQuestionTime() < 30000) {
            signals.push('thoughtful_responses');
        }
        
        if (this.session.maxScrollDepth > 75) {
            signals.push('high_scroll_engagement');
        }
        
        if (!this.session.rageClicks || this.session.rageClicks === 0) {
            signals.push('smooth_interaction');
        }
        
        if (this.session.totalFocusTime > (Date.now() - this.session.startTime) * 0.8) {
            signals.push('high_focus');
        }
        
        if (this.calculateCompletionRate() > 90) {
            signals.push('high_completion');
        }
        
        return signals;
    }

    identifyRiskSignals() {
        const signals = [];
        
        if (this.calculateAverageQuestionTime() < 2000) {
            signals.push('rushing_through');
        }
        
        if (this.session.corrections && this.session.corrections.length > 5) {
            signals.push('high_uncertainty');
        }
        
        if (this.session.rageClicks && this.session.rageClicks > 0) {
            signals.push('frustration_detected');
        }
        
        if (this.session.tabSwitches && this.session.tabSwitches > 5) {
            signals.push('high_distraction');
        }
        
        if (this.session.hesitations && this.session.hesitations.length > 3) {
            signals.push('high_hesitation');
        }
        
        if (this.session.pasteEvents && this.session.pasteEvents > 2) {
            signals.push('potential_automation');
        }
        
        return signals;
    }

    generateBehaviorProfile() {
        return {
            engagementLevel: this.calculateEngagement() > 70 ? 'high' : 
                           this.calculateEngagement() > 40 ? 'medium' : 'low',
            decisionSpeed: this.calculateAverageQuestionTime() < 5000 ? 'fast' :
                          this.calculateAverageQuestionTime() < 15000 ? 'moderate' : 'slow',
            confidence: this.session.corrections?.length < 2 ? 'high' :
                       this.session.corrections?.length < 5 ? 'medium' : 'low',
            thoroughness: this.session.scrollDepth > 80 ? 'high' :
                         this.session.scrollDepth > 50 ? 'medium' : 'low',
            deviceType: this.session.device?.type,
            trustScore: this.identifyTrustSignals().length - this.identifyRiskSignals().length
        };
    }
}

module.exports = BehavioralTracker;


