const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { v4: uuidv4 } = require('uuid');

// Helper: fetch leads from Redis fallback (used when DB is empty/unavailable)
async function getLeadsFromRedis(req) {
    try {
        const redis = req.app.get('redis');
        if (!redis) return [];
        const key = `leads:${req.tenant?.id || 'default'}`;
        const items = await redis.lRange(key, 0, -1);
        return items.map(item => {
            const lead = JSON.parse(item);
            const payload = lead.payload || {};
            return {
                id: lead.id,
                tenant_id: lead.tenant_id,
                created_at: lead.created_at,
                status: payload.status || 'new',
                responses: payload.responses || {},
                results: payload.results || {},
                behavioral_data: payload.behavioral_data || {}
            };
        });
    } catch (_e) {
        return [];
    }
}

// Get all leads for tenant (DB if available, fallback to Redis)
router.get('/', async (req, res) => {
    try {
        let transformedLeads = [];
        try {
            const result = await pool.query(
                'SELECT * FROM leads WHERE tenant_id = $1 ORDER BY created_at DESC',
                [req.tenant.id]
            );
            transformedLeads = result.rows.map(lead => {
                const payload = lead.payload || {};
                const responses = payload.responses || {};
                const results = payload.results || {};
                return {
                    id: lead.id,
                    tenant_id: lead.tenant_id,
                    created_at: lead.created_at,
                    status: lead.status || 'new',
                    responses,
                    results,
                    behavioral_data: payload.behavioral_data || {}
                };
            });
        } catch (_dbErr) {
            // swallow and try redis
        }
        if (!Array.isArray(transformedLeads) || transformedLeads.length === 0) {
            transformedLeads = await getLeadsFromRedis(req);
        }
        res.json({ leads: transformedLeads });
    } catch (error) {
        // last resort
        const fallback = await getLeadsFromRedis(req);
        if (fallback.length > 0) return res.json({ leads: fallback });
        res.status(500).json({ error: error.message });
    }
});

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

// Update candidate status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Update status in database
        let updated = null;
        try {
            const result = await pool.query(
                'UPDATE leads SET status = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
                [status, id, req.tenant.id]
            );
            if (result.rows.length > 0) {
                updated = result.rows[0];
            }
        } catch (_e) {
            // DB might be unavailable; try Redis fallback below
        }

        // If not in DB, update Redis fallback copy
        if (!updated) {
            try {
                const redis = req.app.get('redis');
                if (redis) {
                    const key = `leads:${req.tenant.id}`;
                    const items = await redis.lRange(key, 0, -1);
                    let foundIndex = -1;
                    let foundLead = null;
                    for (let i = 0; i < items.length; i++) {
                        const parsed = JSON.parse(items[i]);
                        if (parsed.id === id) {
                            foundIndex = i;
                            foundLead = parsed;
                            break;
                        }
                    }
                    if (foundIndex !== -1 && foundLead) {
                        const payload = foundLead.payload || {};
                        payload.status = status;
                        foundLead.payload = payload;
                        await redis.lSet(key, foundIndex, JSON.stringify(foundLead));
                        updated = foundLead;
                    }
                }
            } catch (_e) {
                // ignore
            }
        }

        if (!updated) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Notify WebSocket clients about status change
        try {
            const broadcastToTenant = req.app.get('broadcastToTenant');
            if (broadcastToTenant) {
                broadcastToTenant(req.tenant.id, {
                    type: 'status_change',
                    lead_id: id,
                    status: status,
                    tenant_id: req.tenant.id
                });
            }
        } catch (e) {
            // Non-fatal if WebSocket unavailable
        }
        
        res.json({ ok: true, lead: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update candidate notes
router.put('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        // Update notes in database
        const result = await pool.query(
            'UPDATE leads SET internal_notes = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
            [notes, id, req.tenant.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        res.json({ ok: true, lead: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


