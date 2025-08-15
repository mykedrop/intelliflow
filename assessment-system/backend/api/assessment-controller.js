// backend/api/assessment-controller.js

const express = require('express');
const router = express.Router();
const ScoringEngine = require('./scoring-engine');
const CandidateProfile = require('./candidate-profile');
const { pool } = require('../config/database');

// Start assessment session
router.post('/session/start', async (req, res) => {
    const { assessmentId } = req.body;
    const sessionId = generateSessionId();
    
    // Initialize session in database
    await initializeSession(sessionId, assessmentId);
    
    res.json({ sessionId, status: 'started' });
});

// Submit assessment
router.post('/submit', async (req, res) => {
    const { sessionId, data } = req.body;
    
    try {
        // Process assessment data
        const scoringEngine = new ScoringEngine();
        const results = await scoringEngine.processAssessment(data);
        
        // Generate candidate profile
        const profileBuilder = new CandidateProfile();
        const profile = await profileBuilder.build(data, results);
        
        // Store in database
        await storeAssessmentResults(sessionId, profile);
        
        // Trigger notifications
        await notifyRecruiters(sessionId, profile);
        
        res.json({ 
            status: 'success', 
            profileId: profile.id,
            recommendation: profile.recommendation 
        });
    } catch (error) {
        console.error('Assessment submission error:', error);
        res.status(500).json({ error: 'Failed to process assessment' });
    }
});

// Get assessment results
router.get('/results/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    try {
        const results = await getAssessmentResults(sessionId);
        res.json(results);
    } catch (error) {
        res.status(404).json({ error: 'Results not found' });
    }
});

// Get candidate profile
router.get('/profile/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    try {
        const profile = await getCandidateProfile(sessionId);
        res.json(profile);
    } catch (error) {
        res.status(404).json({ error: 'Profile not found' });
    }
});

// Export assessment data
router.get('/export/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { format = 'json' } = req.query;
    
    try {
        const data = await exportAssessmentData(sessionId, format);
        
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="assessment_${sessionId}.csv"`);
        } else {
            res.setHeader('Content-Type', 'application/json');
        }
        
        res.send(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to export data' });
    }
});

// Analytics endpoints
router.get('/analytics/summary', async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

router.get('/analytics/candidates/:timeframe', async (req, res) => {
    const { timeframe } = req.params;
    
    try {
        const candidates = await getCandidatesByTimeframe(timeframe);
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get candidates' });
    }
});

// Helper functions
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function initializeSession(sessionId, assessmentId) {
    try {
        const query = `
            INSERT INTO assessment_sessions (session_id, assessment_id, candidate_email, candidate_name, status)
            VALUES ($1, $2, $3, $4, 'started')
        `;
        await pool.query(query, [sessionId, assessmentId, 'test@example.com', 'Test Candidate']);
        console.log(`Session ${sessionId} initialized for assessment ${assessmentId}`);
    } catch (error) {
        console.error('Error initializing session:', error);
        throw error;
    }
}

async function storeAssessmentResults(sessionId, profile) {
    // Implementation for storing results in database
    console.log(`Storing results for session ${sessionId}`);
}

async function notifyRecruiters(sessionId, profile) {
    // Implementation for notifying recruiters
    console.log(`Notifying recruiters for session ${sessionId}`);
}

async function getAssessmentResults(sessionId) {
    // Implementation for retrieving results
    return { sessionId, status: 'completed' };
}

async function getCandidateProfile(sessionId) {
    // Implementation for retrieving candidate profile
    return { sessionId, profile: {} };
}

async function exportAssessmentData(sessionId, format) {
    // Implementation for exporting data
    if (format === 'csv') {
        return 'sessionId,status,score\n' + sessionId + ',completed,85';
    }
    return { sessionId, status: 'completed', score: 85 };
}

async function getAnalyticsSummary() {
    try {
        const query = `
            SELECT 
                COUNT(*) as totalAssessments,
                AVG(overall_score) as averageScore,
                COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*) as completionRate
            FROM assessment_sessions s
            LEFT JOIN candidate_profiles cp ON s.session_id = cp.session_id
        `;
        const result = await pool.query(query);
        return result.rows[0] || { totalAssessments: 0, averageScore: 0, completionRate: 0 };
    } catch (error) {
        console.error('Error getting analytics summary:', error);
        return { totalAssessments: 0, averageScore: 0, completionRate: 0 };
    }
}

async function getCandidatesByTimeframe(timeframe) {
    // Implementation for getting candidates by timeframe
    return [
        { id: 1, score: 85, status: 'completed' },
        { id: 2, score: 72, status: 'completed' }
    ];
}

module.exports = router;
