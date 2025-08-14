require('dotenv').config();

console.log('Node', process.version);

try {
  const VerticalConfigManager = require('./core/config-manager/VerticalConfigManager');
  const IntelligenceEngine = require('./core/scoring-engine/IntelligenceEngine');
  const BehavioralTracker = require('./core/behavioral-intelligence/BehavioralTracker');

  const vcm = new VerticalConfigManager();
  const allVerticals = vcm.getAllVerticals().map(v => v.id);
  console.log('Verticals loaded:', allVerticals);

  const engine = new IntelligenceEngine();
  const result = engine.determineTier(87);
  console.log('Tier for score 87:', result);

  const tracker = new BehavioralTracker('test');
  tracker.trackQuestionStart('q1');
  const dur = tracker.trackQuestionComplete('q1', 'answer');
  console.log('Behavioral tracker question duration:', dur);
} catch (e) {
  console.error('Verification error:', e);
  process.exit(1);
}

console.log('Verification completed.');


