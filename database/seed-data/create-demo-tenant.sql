-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'leads', 'assessments', 'verticals', 'questions');

-- Ensure demo tenant present
INSERT INTO tenants (
    tenant_id, company_name, api_key, api_secret,
    subscription_tier, billing_status
) VALUES (
    'demo-tenant',
    'Demo Company',
    'demo_api_key_12345',
    '$2a$10$YourHashedSecretHere',
    'pro',
    'active'
) ON CONFLICT (tenant_id) DO NOTHING;


