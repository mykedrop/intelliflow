// server.js

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// API Routes
app.use('/api/candidates', require('./backend/api/candidates'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/recruiting-dashboard-v2.html`);
    console.log(`📝 Assessment: http://localhost:${PORT}/advisor-hiring-v3.html`);
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8001 });

wss.on('connection', (ws) => {
    console.log('New dashboard connected');
    
    ws.on('message', (message) => {
        // Broadcast to all connected dashboards
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

// Make WebSocket server globally available
global.wss = wss;

console.log('🔄 WebSocket server running on ws://localhost:8001');
