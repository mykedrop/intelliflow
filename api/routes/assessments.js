const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all assessments for tenant
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM assessments WHERE tenant_id = $1',
            [req.tenant.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new assessment
router.post('/', async (req, res) => {
    try {
        // Implementation here
        res.json({ message: 'Assessment created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


