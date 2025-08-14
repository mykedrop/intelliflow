const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { v4: uuidv4 } = require('uuid');

// Get all leads for tenant
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM leads WHERE tenant_id = $1 ORDER BY created_at DESC',
            [req.tenant.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

// Accept lead submissions (stores in Redis for real-time processing; DB persistence can be added later)
router.post('/', async (req, res) => {
    try {
        const tenantId = req.tenant?.id || 'default';
        const lead = {
            id: uuidv4(),
            tenant_id: tenantId,
            payload: req.body || {},
            created_at: new Date().toISOString()
        };

        // Push to Redis list for later processing
        try {
            const redis = req.app.get('redis');
            if (redis) {
                await redis.lPush(`leads:${tenantId}`, JSON.stringify(lead));
            }
        } catch (e) {
            // Non-fatal if Redis unavailable
        }

        res.status(201).json({ ok: true, lead_id: lead.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


