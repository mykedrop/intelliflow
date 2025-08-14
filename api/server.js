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
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (CORS_ORIGINS.length === 0 || CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

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
wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'welcome', message: 'Connected to OracleBrain WS' }));
  socket.on('message', (data) => {
    // Echo back
    socket.send(JSON.stringify({ type: 'echo', data: data.toString() }));
  });
});

module.exports = app;


