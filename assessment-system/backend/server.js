// assessment-system/backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const assessmentController = require('./api/assessment-controller');
const testRoutes = require('./test-routes');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// API Routes - Must come before static file serving
console.log('Loading assessment controller...');
console.log('Assessment controller routes:', assessmentController.stack ? assessmentController.stack.length : 'No stack');
app.use('/api/assessment', assessmentController);

console.log('Loading test routes...');
console.log('Test routes:', testRoutes.stack ? testRoutes.stack.length : 'No stack');
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        system: 'Northwestern Mutual Assessment System',
        version: '1.0.0'
    });
});

// Frontend routes - Only for non-API paths
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve static files from frontend (only for non-API paths)
app.use(express.static(path.join(__dirname, '../frontend')));

// Catch-all route for SPA (only for non-API routes)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(PORT, async () => {
    console.log('🚀 Northwestern Mutual Assessment System Server Running');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
    console.log(`📊 API Base: http://localhost:${PORT}/api/assessment`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log('  POST   /api/assessment/session/start');
    console.log('  POST   /api/assessment/submit');
    console.log('  GET    /api/assessment/results/:sessionId');
    console.log('  GET    /api/assessment/profile/:sessionId');
    console.log('  GET    /api/assessment/export/:sessionId');
    console.log('  GET    /api/assessment/analytics/summary');
    console.log('  GET    /api/assessment/analytics/candidates/:timeframe');
    console.log('');
    
    // Initialize database
    try {
        await initializeDatabase();
        console.log('🎯 System ready for candidate assessments!');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('⚠️  System running without database connection');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
