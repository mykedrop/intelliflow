-- Insert sample candidates for Northwestern Mutual demo
-- This script populates the leads table with sample assessment data

-- First, ensure we have a default tenant
INSERT INTO tenants (tenant_id, company_name, api_key, api_secret, branding, config)
VALUES (
    'default',
    'Northwestern Mutual',
    'demo_api_key_12345',
    'demo_secret_12345',
    '{"primaryColor": "#1e40af", "logo": null, "favicon": null, "customDomain": null}',
    '{"verticals": ["financial"], "features": {"behavioral_tracking": true, "ab_testing": false, "webhooks": true, "custom_questions": false}}'
) ON CONFLICT (tenant_id) DO NOTHING;

-- Get the tenant ID
DO $$
DECLARE
    tenant_uuid UUID;
BEGIN
    SELECT id INTO tenant_uuid FROM tenants WHERE tenant_id = 'default';
    
    -- Insert sample candidates
    INSERT INTO leads (
        lead_id,
        tenant_id,
        first_name,
        last_name,
        email,
        phone,
        company,
        job_title,
        status,
        responses,
        raw_scores,
        final_score,
        tier,
        internal_notes,
        created_at
    ) VALUES
    (
        'candidate-001',
        tenant_uuid,
        'Emily',
        'Davis',
        'emily.davis@example.com',
        '555-0125',
        'Previous Company',
        'Sales Representative',
        'new',
        '{
            "contact_info": {
                "first_name": "Emily",
                "last_name": "Davis",
                "email": "emily.davis@example.com",
                "phone": "555-0125"
            },
            "work_style": "farmer",
            "motivation": "recognition",
            "client_approach": "partner",
            "strengths": ["Relationship Building", "Communication", "Empathy"],
            "learning_style": "peer",
            "decision_style": "collaborator",
            "values_rank": ["Client Success", "Team Collaboration", "Personal Growth"],
            "challenge_response": "collaborate"
        }',
        '{
            "culturalFit": 81,
            "salesPotential": 80,
            "leadershipPotential": 76,
            "retentionLikelihood": 82,
            "coachability": 77
        }',
        79,
        'HIGH_POTENTIAL',
        'Strong candidate with excellent interpersonal skills. Would excel in client-facing roles.',
        NOW() - INTERVAL '2 days'
    ),
    (
        'candidate-002',
        tenant_uuid,
        'John',
        'Smith',
        'john.smith@example.com',
        '555-0123',
        'Current Company',
        'Account Manager',
        'new',
        '{
            "contact_info": {
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@example.com",
                "phone": "555-0123"
            },
            "work_style": "hunter",
            "motivation": "achievement",
            "client_approach": "consultant",
            "strengths": ["Leadership", "Strategic Thinking", "Negotiation"],
            "learning_style": "structured",
            "decision_style": "delegator",
            "values_rank": ["Achievement", "Leadership", "Innovation"],
            "challenge_response": "lead"
        }',
        '{
            "culturalFit": 82,
            "salesPotential": 89,
            "leadershipPotential": 85,
            "retentionLikelihood": 90,
            "coachability": 89
        }',
        87,
        'ELITE',
        'Exceptional candidate. Ready for immediate placement in high-value territories.',
        NOW() - INTERVAL '1 day'
    ),
    (
        'candidate-003',
        tenant_uuid,
        'Sarah',
        'Johnson',
        'sarah.johnson@example.com',
        '555-0127',
        'Previous Role',
        'Financial Advisor',
        'reviewed',
        '{
            "contact_info": {
                "first_name": "Sarah",
                "last_name": "Johnson",
                "email": "sarah.johnson@example.com",
                "phone": "555-0127"
            },
            "work_style": "analyst",
            "motivation": "stability",
            "client_approach": "educator",
            "strengths": ["Analytical Thinking", "Risk Management", "Client Education"],
            "learning_style": "structured",
            "decision_style": "analyzer",
            "values_rank": ["Financial Security", "Client Education", "Risk Management"],
            "challenge_response": "analyze"
        }',
        '{
            "culturalFit": 75,
            "salesPotential": 68,
            "leadershipPotential": 72,
            "retentionLikelihood": 88,
            "coachability": 82
        }',
        77,
        'SOLID',
        'Good analytical skills and risk management focus. Would be excellent for conservative client portfolios.',
        NOW() - INTERVAL '3 days'
    ),
    (
        'candidate-004',
        tenant_uuid,
        'Michael',
        'Chen',
        'michael.chen@example.com',
        '555-0129',
        'Current Position',
        'Business Development',
        'interview_scheduled',
        '{
            "contact_info": {
                "first_name": "Michael",
                "last_name": "Chen",
                "email": "michael.chen@example.com",
                "phone": "555-0129"
            },
            "work_style": "hunter",
            "motivation": "achievement",
            "client_approach": "consultant",
            "strengths": ["Networking", "Strategic Planning", "Market Analysis"],
            "learning_style": "peer",
            "decision_style": "delegator",
            "values_rank": ["Growth", "Innovation", "Achievement"],
            "challenge_response": "lead"
        }',
        '{
            "culturalFit": 78,
            "salesPotential": 85,
            "leadershipPotential": 79,
            "retentionLikelihood": 75,
            "coachability": 80
        }',
        79,
        'HIGH_POTENTIAL',
        'Strong business development background. Excellent for expanding into new markets.',
        NOW() - INTERVAL '4 days'
    ),
    (
        'candidate-005',
        tenant_uuid,
        'Lisa',
        'Rodriguez',
        'lisa.rodriguez@example.com',
        '555-0131',
        'Previous Company',
        'Relationship Manager',
        'rejected',
        '{
            "contact_info": {
                "first_name": "Lisa",
                "last_name": "Rodriguez",
                "email": "lisa.rodriguez@example.com",
                "phone": "555-0131"
            },
            "work_style": "farmer",
            "motivation": "stability",
            "client_approach": "partner",
            "strengths": ["Client Retention", "Communication", "Problem Solving"],
            "learning_style": "peer",
            "decision_style": "collaborator",
            "values_rank": ["Client Success", "Stability", "Team Work"],
            "challenge_response": "collaborate"
        }',
        '{
            "culturalFit": 65,
            "salesPotential": 58,
            "leadershipPotential": 62,
            "retentionLikelihood": 70,
            "coachability": 65
        }',
        64,
        'DEVELOPING',
        'Good relationship skills but lacks the drive needed for our high-performance culture.',
        NOW() - INTERVAL '5 days'
    )
    ON CONFLICT (lead_id) DO NOTHING;
    
    RAISE NOTICE 'Inserted sample candidates for tenant: %', tenant_uuid;
END $$;

-- Verify the data was created
SELECT 
    first_name, 
    last_name, 
    email, 
    final_score, 
    tier,
    created_at
FROM leads 
WHERE tenant_id = (SELECT id FROM tenants WHERE tenant_id = 'default')
ORDER BY created_at DESC;
