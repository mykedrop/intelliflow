// backend/api/candidates.js

const express = require('express');
const router = express.Router();
const pool = require('../database/connection');

// Submit candidate with assessment data
router.post('/submit', async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        phone,
        linkedin,
        score,
        tier,
        responses,
        behaviorData,
        submittedAt
    } = req.body;
    
    try {
        // Insert into candidates table
        const candidateResult = await pool.query(
            `INSERT INTO candidates 
            (first_name, last_name, email, phone, linkedin, score, tier, status, submitted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id`,
            [firstName, lastName, email, phone, linkedin, score, tier, 'new', submittedAt]
        );
        
        const candidateId = candidateResult.rows[0].id;
        
        // Store assessment responses
        await pool.query(
            `INSERT INTO assessment_responses 
            (candidate_id, responses, behavior_data)
            VALUES ($1, $2, $3)`,
            [candidateId, JSON.stringify(responses), JSON.stringify(behaviorData)]
        );
        
        // Broadcast to dashboard via WebSocket
        if (global.wss) {
            global.wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: 'new_candidate',
                        candidate: {
                            id: candidateId,
                            name: `${firstName} ${lastName}`,
                            email,
                            score,
                            tier,
                            status: 'new',
                            submittedAt
                        }
                    }));
                }
            });
        }
        
        res.json({
            success: true,
            candidateId,
            message: 'Candidate submitted successfully'
        });
        
    } catch (error) {
        console.error('Error submitting candidate:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit candidate'
        });
    }
});

// Get all candidates for dashboard
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM candidates 
            ORDER BY submitted_at DESC 
            LIMIT 100`
        );
        
        res.json({
            candidates: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({
            error: 'Failed to fetch candidates'
        });
    }
});

// Get one candidate basic info
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM candidates WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.json({ candidate: result.rows[0] });
    } catch (error) {
        console.error('Error fetching candidate:', error);
        res.status(500).json({ error: 'Failed to fetch candidate' });
    }
});

// Get candidate details including latest assessment responses and behavior data
router.get('/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
        const candidateResult = await pool.query(
            `SELECT * FROM candidates WHERE id = $1 LIMIT 1`,
            [id]
        );

        if (candidateResult.rows.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const responsesResult = await pool.query(
            `SELECT responses, behavior_data, created_at
             FROM assessment_responses
             WHERE candidate_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [id]
        );

        res.json({
            candidate: candidateResult.rows[0],
            assessment: responsesResult.rows[0] || null
        });
    } catch (error) {
        console.error('Error fetching candidate details:', error);
        res.status(500).json({ error: 'Failed to fetch candidate details' });
    }
});

module.exports = router;
