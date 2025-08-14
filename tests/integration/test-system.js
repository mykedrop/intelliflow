'use strict';

const axios = require('axios');

async function testSystem() {
  const baseUrl = 'http://localhost:8000';
  console.log('Testing health endpoint...');
  const health = await axios.get(`${baseUrl}/health`);
  console.log('Health:', health.data);

  console.log('Testing enhanced assessment...');
  const session = await axios.post(
    `${baseUrl}/api/enhanced-assessment/session/start`,
    { assessmentId: 'test' },
    { headers: { 'x-api-key': 'demo_api_key_12345' } }
  );
  console.log('Session:', session.data);

  console.log('Testing candidates endpoint...');
  const leads = await axios.get(
    `${baseUrl}/api/leads`,
    { headers: { 'x-tenant-id': process.env.DEFAULT_TENANT || 'default' } }
  );
  console.log('Candidates count:', Array.isArray(leads.data) ? leads.data.length : 'unknown');
}

testSystem().catch((err) => {
  console.error('Test failed:', err.response ? err.response.data : err.message);
  process.exit(1);
});


