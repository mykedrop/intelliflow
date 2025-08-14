'use strict';

class DeepBehavioralIntelligence {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.data = {
      // Core tracking
      questionTimings: [],
      mousePatterns: [],
      hesitations: [],
      corrections: [],

      // New deep tracking
      hoverPatterns: [],
      mouseVelocity: [],
      scrollBehavior: [],
      attentionZones: new Map(),
      energyMap: [],
      fatigueIndicators: [],
      confidenceMarkers: [],

      // Consistency tracking
      answerChanges: [],
      reviewPatterns: [],

      // Engagement metrics
      questionEngagement: new Map(),
      progressiveEngagement: [],

      // Device and environment
      deviceFingerprint: this.getDeviceFingerprint(),
      tabSwitches: 0,
      copyPasteEvents: 0,

      // Performance under pressure
      responseAcceleration: [],
      stressIndicators: []
    };

    this.initializeTracking();
  }

  initializeTracking() {
    if (typeof window === 'undefined') return;

    // Enhanced mouse tracking with velocity
    this.trackMouseVelocity();

    // Hover pattern tracking
    this.trackHoverPatterns();

    // Attention zone mapping
    this.trackAttentionZones();

    // Energy and fatigue tracking
    this.trackEnergyLevels();

    // Confidence indicators
    this.trackConfidenceMarkers();

    // Tab switch detection
    this.trackTabSwitches();

    // Copy/paste detection
    this.trackCopyPaste();
  }

  trackMouseVelocity() {
    let lastX = 0, lastY = 0, lastTime = Date.now();
    let velocityBuffer = [];

    if (typeof document === 'undefined') return;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      const timeDelta = now - lastTime;

      if (timeDelta > 50) {
        const distance = Math.sqrt(
          Math.pow(e.clientX - lastX, 2) +
          Math.pow(e.clientY - lastY, 2)
        );

        const velocity = distance / timeDelta;

        velocityBuffer.push({
          velocity,
          timestamp: now - this.startTime,
          x: e.clientX,
          y: e.clientY
        });

        if (velocity > 5) {
          this.data.stressIndicators.push({
            type: 'rapid_mouse_movement',
            velocity,
            timestamp: now - this.startTime
          });
        }

        if (velocityBuffer.length > 100) {
          this.data.mouseVelocity.push({
            average: velocityBuffer.reduce((a, b) => a + b.velocity, 0) / velocityBuffer.length,
            max: Math.max(...velocityBuffer.map(v => v.velocity)),
            pattern: this.classifyMovementPattern(velocityBuffer)
          });
          velocityBuffer = [];
        }

        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      }
    });
  }

  trackHoverPatterns() {
    let hoverStart = null;
    let currentTarget = null;

    if (typeof document === 'undefined') return;
    document.addEventListener('mouseover', (e) => {
      const target = e.target;
      if (!target || !target.classList) return;
      if (target.classList.contains('option-card') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT') {
        hoverStart = Date.now();
        currentTarget = target;
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (hoverStart && currentTarget === e.target) {
        const duration = Date.now() - hoverStart;

        this.data.hoverPatterns.push({
          element: e.target && (e.target.dataset?.value || e.target.name || e.target.id) || 'unknown',
          duration,
          timestamp: Date.now() - this.startTime,
          hesitation: duration > 2000
        });

        if (duration > 2000 && duration < 10000) {
          this.data.hesitations.push({
            type: 'hover_hesitation',
            element: e.target && e.target.dataset ? e.target.dataset.value : undefined,
            duration,
            timestamp: Date.now() - this.startTime
          });
        }

        hoverStart = null;
        currentTarget = null;
      }
    });
  }

  trackAttentionZones() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const zones = {
      top: { y: 0, height: window.innerHeight / 3, time: 0 },
      middle: { y: window.innerHeight / 3, height: window.innerHeight / 3, time: 0 },
      bottom: { y: (window.innerHeight / 3) * 2, height: window.innerHeight / 3, time: 0 }
    };

    let lastZone = null;
    let zoneEnterTime = Date.now();

    document.addEventListener('mousemove', (e) => {
      let currentZone = null;
      if (e.clientY < window.innerHeight / 3) currentZone = 'top';
      else if (e.clientY < (window.innerHeight / 3) * 2) currentZone = 'middle';
      else currentZone = 'bottom';

      if (currentZone !== lastZone) {
        if (lastZone) {
          const timeInZone = Date.now() - zoneEnterTime;
          this.data.attentionZones.set(
            lastZone,
            (this.data.attentionZones.get(lastZone) || 0) + timeInZone
          );
        }
        lastZone = currentZone;
        zoneEnterTime = Date.now();
      }
    });
  }

  trackEnergyLevels() {
    let lastQuestionTime = Date.now();
    this.trackQuestionTiming = (questionId) => {
      const now = Date.now();
      const timeSinceStart = now - this.startTime;
      const responseTime = now - lastQuestionTime;

      this.data.energyMap.push({
        questionId,
        responseTime,
        timeSinceStart,
        energy: this.calculateEnergyLevel(responseTime, timeSinceStart)
      });

      if (this.data.energyMap.length > 3) {
        const recent = this.data.energyMap.slice(-3);
        const avgRecent = recent.reduce((a, b) => a + b.responseTime, 0) / 3;
        const avgInitial = this.data.energyMap.slice(0, 3).reduce((a, b) => a + b.responseTime, 0) / 3;

        if (avgRecent > avgInitial * 1.5) {
          this.data.fatigueIndicators.push({
            type: 'response_slowdown',
            ratio: avgRecent / avgInitial,
            timestamp: timeSinceStart
          });
        }
      }

      lastQuestionTime = now;
    };
  }

  calculateEnergyLevel(responseTime, timeSinceStart) {
    let energy = 100;
    if (responseTime > 30000) energy -= 30;
    else if (responseTime > 20000) energy -= 20;
    else if (responseTime > 10000) energy -= 10;
    if (timeSinceStart > 600000) energy -= 20;
    else if (timeSinceStart > 300000) energy -= 10;
    return Math.max(energy, 0);
  }

  trackConfidenceMarkers() {
    let answerChangeCount = 0;
    this.trackAnswerChange = (questionId, oldAnswer, newAnswer) => {
      answerChangeCount++;
      this.data.confidenceMarkers.push({
        type: 'answer_change',
        questionId,
        changeCount: answerChangeCount,
        from: oldAnswer,
        to: newAnswer,
        timestamp: Date.now() - this.startTime,
        confidence: answerChangeCount > 2 ? 'low' : 'medium'
      });
    };
    this.assessConfidence = (responseTime) => {
      if (responseTime < 3000) return 'high';
      if (responseTime < 10000) return 'medium';
      return 'low';
    };
  }

  trackTabSwitches() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.data.tabSwitches++;
        this.data.stressIndicators.push({
          type: 'tab_switch',
          count: this.data.tabSwitches,
          timestamp: Date.now() - this.startTime
        });
      }
    });
  }

  trackCopyPaste() {
    if (typeof document === 'undefined') return;
    document.addEventListener('copy', () => {
      this.data.copyPasteEvents++;
    });
    document.addEventListener('paste', (e) => {
      this.data.copyPasteEvents++;
      this.data.confidenceMarkers.push({
        type: 'paste_event',
        field: e.target && (e.target.name || e.target.id) || undefined,
        timestamp: Date.now() - this.startTime,
        confidence: 'low'
      });
    });
  }

  classifyMovementPattern(velocityBuffer) {
    const avgVelocity = velocityBuffer.reduce((a, b) => a + b.velocity, 0) / velocityBuffer.length;
    if (avgVelocity < 0.5) return 'precise';
    if (avgVelocity < 2) return 'normal';
    if (avgVelocity < 5) return 'quick';
    return 'erratic';
  }

  getDeviceFingerprint() {
    if (typeof window === 'undefined') return {};
    return {
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory,
      touchPoints: navigator.maxTouchPoints
    };
  }

  generateIntelligenceReport() {
    const totalTime = Date.now() - this.startTime;
    return {
      confidenceScore: this.calculateConfidenceScore(),
      engagementScore: this.calculateEngagementScore(),
      stressLevel: this.calculateStressLevel(),
      energyPattern: this.analyzeEnergyPattern(),
      decisionStyle: this.classifyDecisionStyle(),
      redFlags: this.identifyRedFlags(),
      insights: this.generateBehavioralInsights(),
      metrics: {
        totalTime,
        tabSwitches: this.data.tabSwitches,
        copyPasteEvents: this.data.copyPasteEvents,
        hesitations: this.data.hesitations.length,
        corrections: this.data.corrections.length,
        averageResponseTime: this.calculateAverageResponseTime(),
        movementPattern: this.getMovementPattern()
      }
    };
  }

  calculateConfidenceScore() {
    let score = 80;
    score -= this.data.hesitations.length * 5;
    score -= this.data.corrections.length * 3;
    score -= this.data.tabSwitches * 10;
    score -= this.data.copyPasteEvents * 15;
    const quickResponses = this.data.energyMap.filter(e => e.responseTime < 5000).length;
    score += quickResponses * 2;
    return Math.max(0, Math.min(100, score));
  }

  calculateEngagementScore() {
    let score = 70;
    if (this.data.energyMap.length > 0) {
      const avgEnergy = this.data.energyMap.reduce((a, b) => a + b.energy, 0) / this.data.energyMap.length;
      score = avgEnergy;
    }
    const middleZoneTime = this.data.attentionZones.get('middle') || 0;
    const totalZoneTime = Array.from(this.data.attentionZones.values()).reduce((a, b) => a + b, 0);
    if (totalZoneTime > 0) {
      const middlePercent = (middleZoneTime / totalZoneTime) * 100;
      if (middlePercent > 60) score += 10;
    }
    return Math.min(100, score);
  }

  calculateStressLevel() {
    const stressCount = this.data.stressIndicators.length;
    if (stressCount === 0) return 'low';
    if (stressCount < 5) return 'medium';
    return 'high';
  }

  analyzeEnergyPattern() {
    if (this.data.energyMap.length < 3) return 'insufficient_data';
    const third = Math.floor(this.data.energyMap.length / 3);
    const firstThird = this.data.energyMap.slice(0, third);
    const lastThird = this.data.energyMap.slice(-third);
    const avgFirst = firstThird.reduce((a, b) => a + b.energy, 0) / firstThird.length;
    const avgLast = lastThird.reduce((a, b) => a + b.energy, 0) / lastThird.length;
    if (avgLast > avgFirst * 0.9) return 'sustained_high';
    if (avgLast > avgFirst * 0.7) return 'gradual_decline';
    if (avgLast > avgFirst * 0.5) return 'moderate_fatigue';
    return 'significant_fatigue';
  }

  classifyDecisionStyle() {
    const avgResponseTime = this.calculateAverageResponseTime();
    const hesitationRate = this.data.hesitations.length / Math.max(this.data.questionTimings.length, 1);
    if (avgResponseTime < 5000 && hesitationRate < 0.1) return 'decisive';
    if (avgResponseTime < 10000 && hesitationRate < 0.3) return 'balanced';
    if (avgResponseTime < 20000 && hesitationRate < 0.5) return 'deliberative';
    return 'cautious';
  }

  identifyRedFlags() {
    const flags = [];
    if (this.data.tabSwitches > 5) flags.push('Excessive tab switching - possible external assistance');
    if (this.data.copyPasteEvents > 2) flags.push('Multiple paste events - possible prepared answers');
    if (this.data.hesitations.length > 10) flags.push('High hesitation count - uncertainty or difficulty');
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime < 2000) flags.push('Extremely fast responses - possible lack of consideration');
    if (this.data.stressIndicators.filter(s => s.type === 'rapid_mouse_movement').length > 10) {
      flags.push('Erratic mouse patterns - frustration or confusion');
    }
    return flags;
  }

  generateBehavioralInsights() {
    const insights = [];
    const confidence = this.calculateConfidenceScore();
    if (confidence > 80) insights.push('High confidence - decisive and sure of responses');
    else if (confidence < 50) insights.push('Low confidence - significant uncertainty detected');
    const engagement = this.calculateEngagementScore();
    if (engagement > 80) insights.push('Highly engaged throughout assessment');
    else if (engagement < 50) insights.push('Low engagement - possible disinterest or fatigue');
    const energyPattern = this.analyzeEnergyPattern();
    if (energyPattern === 'sustained_high') insights.push('Maintained high energy - strong focus and stamina');
    else if (energyPattern === 'significant_fatigue') insights.push('Significant fatigue detected - may impact later responses');
    const decisionStyle = this.classifyDecisionStyle();
    insights.push(`Decision style: ${decisionStyle}`);
    return insights;
  }

  calculateAverageResponseTime() {
    if (this.data.energyMap.length === 0) return 0;
    return this.data.energyMap.reduce((a, b) => a + b.responseTime, 0) / this.data.energyMap.length;
  }

  getMovementPattern() {
    if (this.data.mouseVelocity.length === 0) return 'unknown';
    const patterns = this.data.mouseVelocity.map(v => v.pattern);
    const counts = {};
    patterns.forEach(p => counts[p] = (counts[p] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }
}

module.exports = DeepBehavioralIntelligence;


