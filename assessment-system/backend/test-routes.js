// assessment-system/backend/test-routes.js

const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Test route working!' });
});

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'Assessment routes are working'
    });
});

module.exports = router;
