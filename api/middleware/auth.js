'use strict';

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function apiKeyAuth(req, res, next) {
  const apiKey = req.header('x-api-key');
  // Allow explicitly disabled auth for local dev
  if (String(process.env.DISABLE_AUTH || 'false').toLowerCase() === 'true') {
    return next();
  }
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  try {
    const result = await pool.query('SELECT id, tenant_id, company_name FROM tenants WHERE api_key = $1 LIMIT 1', [apiKey]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    // Attach resolved tenant UUID as preferred internal identifier
    req.tenant = { id: result.rows[0].id, code: result.rows[0].tenant_id, name: result.rows[0].company_name };
    next();
  } catch (err) {
    // If DB not available, fail closed unless explicitly disabled
    return res.status(503).json({ error: 'Auth service unavailable', details: err.message });
  }
}

module.exports = apiKeyAuth;


