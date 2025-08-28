'use strict';

const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';
  const tenantEnv = process.env.DEFAULT_TENANT || 'default';
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  // Resolve tenant UUID if given code 'default'
  let tenantId = tenantEnv;
  if (tenantEnv && tenantEnv.length < 36) {
    const res = await client.query('SELECT id FROM tenants WHERE tenant_id = $1 LIMIT 1', [tenantEnv]);
    if (res.rows.length === 0) throw new Error(`Tenant not found for code ${tenantEnv}`);
    tenantId = res.rows[0].id;
  }

  const leads = [
    {
      lead_id: 'lead_ajudge',
      first_name: 'Aaron',
      last_name: 'Judge',
      email: 'aaron.judge@example.com',
      phone: '555-0101',
      company: 'Yankees',
      job_title: 'Outfielder',
      responses: {
        contact_info: { first_name: 'Aaron', last_name: 'Judge', email: 'aaron.judge@example.com', phone: '555-0101' },
        work_style: 'hunter', motivation: 'achievement', client_approach: 'consultant', learning_style: 'structured',
        challenge_response: 'lead', strengths: ['Leadership', 'Negotiation', 'Strategic Thinking']
      },
      raw_scores: { culturalFit: 95, salesPotential: 94, leadershipPotential: 93, retentionLikelihood: 90, coachability: 89 },
      final_score: 92,
      tier: 'ELITE'
    },
    {
      lead_id: 'lead_jallen',
      first_name: 'Josh',
      last_name: 'Allen',
      email: 'josh.allen@example.com',
      phone: '555-0102',
      company: 'Bills',
      job_title: 'Quarterback',
      responses: {
        contact_info: { first_name: 'Josh', last_name: 'Allen', email: 'josh.allen@example.com', phone: '555-0102' },
        work_style: 'hunter', motivation: 'impact', client_approach: 'consultant', learning_style: 'peer',
        challenge_response: 'collaborate', strengths: ['Leadership', 'Communication', 'Resilience']
      },
      raw_scores: { culturalFit: 90, salesPotential: 90, leadershipPotential: 92, retentionLikelihood: 85, coachability: 83 },
      final_score: 88,
      tier: 'ELITE'
    },
    {
      lead_id: 'lead_bharper',
      first_name: 'Bryce',
      last_name: 'Harper',
      email: 'bryce.harper@example.com',
      phone: '555-0103',
      company: 'Phillies',
      job_title: 'Outfielder',
      responses: {
        contact_info: { first_name: 'Bryce', last_name: 'Harper', email: 'bryce.harper@example.com', phone: '555-0103' },
        work_style: 'analyst', motivation: 'achievement', client_approach: 'partner', learning_style: 'structured',
        challenge_response: 'analyze', strengths: ['Analytics', 'Problem Solving', 'Discipline']
      },
      raw_scores: { culturalFit: 80, salesPotential: 75, leadershipPotential: 70, retentionLikelihood: 82, coachability: 83 },
      final_score: 78,
      tier: 'HIGH_POTENTIAL'
    }
  ];

  for (const l of leads) {
    await client.query(
      `INSERT INTO leads (
        lead_id, tenant_id, first_name, last_name, email, phone, company, job_title,
        responses, raw_scores, final_score, tier, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::jsonb, $10::jsonb, $11, $12, $13, NOW()
      ) ON CONFLICT (lead_id) DO NOTHING`,
      [
        l.lead_id, tenantId, l.first_name, l.last_name, l.email, l.phone, l.company, l.job_title,
        JSON.stringify(l.responses), JSON.stringify(l.raw_scores), l.final_score, l.tier, 'new'
      ]
    );
  }

  console.log('Inserted test leads for tenant', tenantId);
  await client.end();
}

run().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});


