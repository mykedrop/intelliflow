require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Pool } = require('pg');
const redis = require('redis');
const http = require('http');
const { readFileSync } = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Config
const API_PORT = parseInt(process.env.API_PORT || '8000', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_MULTI_TENANT = String(process.env.ENABLE_MULTI_TENANT || 'true').toLowerCase() === 'true';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Redis
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis connect error:', err.message);
  }
})();

// App
const app = express();
app.set('db', pool);
app.set('redis', redisClient);

// Security & Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin/no origin (e.g., curl) and 'null' origin from file:// contexts
    if (!origin || origin === 'null') return callback(null, true);
    // Allow localhost dev origins broadly in development
    if (NODE_ENV === 'development' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      return callback(null, true);
    }
    if (CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-tenant-id'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Multi-tenant middleware: infer tenant from header or query
app.use((req, _res, next) => {
  const tenantHeader = req.header('x-tenant-id');
  const tenantQuery = req.query.tenant_id || req.query.tenant;
  const defaultTenant = process.env.DEFAULT_TENANT || 'default';
  req.tenant = { id: tenantHeader || tenantQuery || defaultTenant };
  next();
});

// Health endpoint
app.get('/health', async (req, res) => {
  const status = { status: 'healthy', timestamp: new Date().toISOString(), services: {} };
  try {
    await pool.query('SELECT 1');
    status.services.database = 'connected';
  } catch (e) {
    status.services.database = 'unavailable';
    status.services.database_error = e.message;
  }
  try {
    const pong = await redisClient.ping();
    status.services.redis = pong === 'PONG' ? 'connected' : 'unavailable';
  } catch (e) {
    status.services.redis = 'unavailable';
    status.services.redis_error = e.message;
  }
  try {
    const pkg = require(path.join(process.cwd(), 'package.json'));
    status.services.version = pkg.version;
  } catch (_e) {
    status.services.version = 'UNKNOWN';
  }
  res.json(status);
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ name: 'OracleBrain Intelligence Platform', status: 'ok' });
});

// Routes
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/leads', require('./routes/leads'));
// Versioned alias for compatibility with frontend
app.use('/api/v1/leads', require('./routes/leads'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/enhanced-assessment', require('./routes/enhanced-assessment'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message });
});

// Start HTTP server
const server = http.createServer(app);
server.listen(API_PORT, () => {
  const pkg = require(path.join(process.cwd(), 'package.json'));
  const banner = [
    '🚀 OracleBrain Intelligence Platform',
    '═══════════════════════════════════════',
    `📡 API Server:     http://localhost:${API_PORT}`,
    `🔌 WebSocket:      ws://localhost:${WS_PORT}`,
    `🌍 Environment:    ${NODE_ENV}`,
    `🏢 Multi-tenant:   ${ENABLE_MULTI_TENANT ? 'Enabled' : 'Disabled'}`,
    `📊 Version:        ${pkg.version || 'UNKNOWN'}`,
    '═══════════════════════════════════════',
  ];
  console.log(banner.join('\n'));
});

// WebSocket server (ws)
const wss = new WebSocket.Server({ port: WS_PORT });

// Store connected clients by tenant
const connectedClients = new Map();

wss.on('connection', (socket) => {
    let clientTenant = 'default';
    
    socket.send(JSON.stringify({ type: 'welcome', message: 'Connected to OracleBrain WS' }));
    
    // Handle client authentication and tenant assignment
    socket.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            if (message.type === 'authenticate') {
                clientTenant = message.tenant_id || 'default';
                
                // Add client to tenant group
                if (!connectedClients.has(clientTenant)) {
                    connectedClients.set(clientTenant, new Set());
                }
                connectedClients.get(clientTenant).add(socket);
                
                socket.send(JSON.stringify({ 
                    type: 'authenticated', 
                    tenant_id: clientTenant 
                }));
            }
        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    });
    
    // Handle client disconnect
    socket.on('close', () => {
        // Remove from all tenant groups
        connectedClients.forEach((clients, tenant) => {
            if (clients.has(socket)) {
                clients.delete(socket);
                if (clients.size === 0) {
                    connectedClients.delete(tenant);
                }
            }
        });
    });
});

// Function to broadcast to specific tenant
function broadcastToTenant(tenantId, message) {
    const clients = connectedClients.get(tenantId);
    if (clients) {
        const messageStr = JSON.stringify(message);
        clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(messageStr);
            }
        });
    }
}

// Make broadcast function available to routes
app.set('broadcastToTenant', broadcastToTenant);

module.exports = app;


