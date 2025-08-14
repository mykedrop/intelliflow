const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get recent analytics events for tenant
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM analytics_events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100',
            [req.tenant.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


