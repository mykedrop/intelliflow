-- Create sample candidates for demo
INSERT INTO leads (
    lead_id, tenant_id, assessment_id,
    first_name, last_name, email, phone,
    responses, behavioral_data,
    raw_scores, final_score, tier,
    ai_insights,
    created_at
) VALUES 
(
    'lead_001',
    (SELECT id FROM tenants WHERE tenant_id = 'demo-tenant'),
    NULL,
    'Sarah',
    'Chen',
    'sarah.chen@email.com',
    '+1-555-0101',
    '{"work_style": "hunter", "client_approach": "educator", "motivation": "achievement", "strengths": ["Leadership", "Communication", "Strategic Thinking"]}',
    '{"confidenceScore": 88, "engagementScore": 92, "stressLevel": "low", "energyPattern": "sustained_high"}',
    '{"salesPotential": 85, "leadershipPotential": 90, "culturalFit": 88}',
    88,
    'ELITE',
    '{"percentile": 95, "insights": ["High confidence", "Natural leader"], "recommendations": ["Fast-track for interview", "Consider leadership track"]}',
    NOW() - INTERVAL '2 days'
),
(
    'lead_002',
    (SELECT id FROM tenants WHERE tenant_id = 'demo-tenant'),
    NULL,
    'Marcus',
    'Rodriguez',
    'marcus.rodriguez@email.com',
    '+1-555-0102',
    '{"work_style": "farmer", "client_approach": "partner", "motivation": "impact", "strengths": ["Relationship Building", "Empathy", "Persistence"]}',
    '{"confidenceScore": 75, "engagementScore": 78, "stressLevel": "medium", "energyPattern": "gradual_decline"}',
    '{"salesPotential": 72, "leadershipPotential": 65, "culturalFit": 85}',
    74,
    'HIGH_POTENTIAL',
    '{"percentile": 78, "insights": ["Client-focused", "Relationship builder"], "recommendations": ["Pair with mentor", "Focus on sales training"]}',
    NOW() - INTERVAL '1 day'
),
(
    'lead_003',
    (SELECT id FROM tenants WHERE tenant_id = 'demo-tenant'),
    NULL,
    'Jennifer',
    'Thompson',
    'jennifer.thompson@email.com',
    '+1-555-0103',
    '{"work_style": "analyst", "client_approach": "consultant", "motivation": "growth", "strengths": ["Analytics", "Problem Solving", "Strategic Thinking"]}',
    '{"confidenceScore": 82, "engagementScore": 79, "stressLevel": "low", "energyPattern": "sustained_high"}',
    '{"salesPotential": 68, "leadershipPotential": 75, "culturalFit": 80}',
    76,
    'HIGH_POTENTIAL',
    '{"percentile": 82, "insights": ["Analytical thinker", "Growth mindset"], "recommendations": ["Technical training", "Sales coaching"]}',
    NOW() - INTERVAL '3 hours'
),
(
    'lead_004',
    (SELECT id FROM tenants WHERE tenant_id = 'demo-tenant'),
    NULL,
    'David',
    'Kim',
    'david.kim@email.com',
    '+1-555-0104',
    '{"work_style": "coach", "client_approach": "educator", "motivation": "impact", "strengths": ["Leadership", "Communication", "Adaptability"]}',
    '{"confidenceScore": 90, "engagementScore": 88, "stressLevel": "low", "energyPattern": "sustained_high"}',
    '{"salesPotential": 78, "leadershipPotential": 92, "culturalFit": 90}',
    87,
    'ELITE',
    '{"percentile": 92, "insights": ["Natural coach", "High integrity"], "recommendations": ["Leadership development", "Team lead role"]}',
    NOW() - INTERVAL '1 hour'
),
(
    'lead_005',
    (SELECT id FROM tenants WHERE tenant_id = 'demo-tenant'),
    NULL,
    'Amanda',
    'Foster',
    'amanda.foster@email.com',
    '+1-555-0105',
    '{"work_style": "hunter", "client_approach": "expert", "motivation": "achievement", "strengths": ["Negotiation", "Persistence", "Time Management"]}',
    '{"confidenceScore": 70, "engagementScore": 65, "stressLevel": "medium", "energyPattern": "moderate_fatigue"}',
    '{"salesPotential": 75, "leadershipPotential": 60, "culturalFit": 70}',
    68,
    'SOLID',
    '{"percentile": 65, "insights": ["Results-driven", "May need support"], "recommendations": ["Stress management", "Work-life balance coaching"]}',
    NOW() - INTERVAL '30 minutes'
);

-- Verify the data was created
SELECT 
    first_name, 
    last_name, 
    email, 
    final_score, 
    tier,
    created_at
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE tenant_id = 'demo-tenant')
ORDER BY created_at DESC;
