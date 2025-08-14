-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema for multi-tenant isolation
CREATE SCHEMA IF NOT EXISTS public;

-- Tenants table (white-label clients)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(100) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    
    -- White-label configuration
    branding JSONB DEFAULT '{
        "primaryColor": "#3b82f6",
        "logo": null,
        "favicon": null,
        "customDomain": null
    }',
    
    -- Feature configuration
    config JSONB DEFAULT '{
        "verticals": ["financial"],
        "features": {
            "behavioral_tracking": true,
            "ab_testing": false,
            "webhooks": true,
            "custom_questions": false
        }
    }',
    
    -- Limits and quotas
    limits JSONB DEFAULT '{
        "assessments_per_month": 1000,
        "leads_per_month": 5000,
        "api_calls_per_hour": 1000,
        "storage_gb": 10
    }',
    
    -- Billing
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    billing_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    trial_ends_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_subscription CHECK (subscription_tier IN ('free', 'starter', 'growth', 'pro', 'enterprise'))
);

-- Verticals configuration
CREATE TABLE verticals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vertical_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    
    -- Question configuration
    question_bank JSONB NOT NULL DEFAULT '[]',
    question_flow JSONB DEFAULT '{
        "type": "linear",
        "branching_rules": []
    }',
    
    -- Scoring configuration
    scoring_config JSONB NOT NULL DEFAULT '{
        "algorithm": "12-dimensional",
        "weights": {},
        "thresholds": {}
    }',
    
    -- Report templates
    report_templates JSONB NOT NULL DEFAULT '{
        "consumer": null,
        "business": null,
        "executive": null
    }',
    
    -- Behavioral markers
    behavioral_markers JSONB DEFAULT '{
        "high_value": [],
        "urgent": [],
        "qualified": []
    }',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version VARCHAR(20) DEFAULT '1.0.0'
);

-- Assessments (multi-tenant, multi-vertical)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vertical_id UUID REFERENCES verticals(id),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    config JSONB DEFAULT '{
        "questions": [],
        "scoring": {},
        "branding": {},
        "behavior_tracking": true
    }',
    
    -- Deployment
    deployment_mode VARCHAR(50) DEFAULT 'widget',
    deployment_config JSONB DEFAULT '{}',
    embed_code TEXT,
    
    -- Access control
    is_public BOOLEAN DEFAULT true,
    password VARCHAR(255),
    allowed_domains JSONB DEFAULT '[]',
    
    -- Analytics
    views INTEGER DEFAULT 0,
    starts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    avg_time_seconds INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    CONSTRAINT valid_deployment CHECK (deployment_mode IN ('widget', 'iframe', 'standalone', 'api'))
);

-- Leads (multi-tenant)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id),
    
    -- Personal Information (encrypted)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    job_title VARCHAR(100),
    
    -- Demographics
    age_range VARCHAR(20),
    gender VARCHAR(20),
    income_range VARCHAR(50),
    
    -- Location
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50),
    zip_code VARCHAR(20),
    timezone VARCHAR(50),
    ip_address INET,
    
    -- Assessment Data
    responses JSONB NOT NULL DEFAULT '{}',
    question_timings JSONB DEFAULT '[]',
    
    -- Behavioral Data
    behavioral_data JSONB DEFAULT '{
        "device": {},
        "mouseMovements": [],
        "scrollEvents": [],
        "hesitations": [],
        "corrections": []
    }',
    
    -- Scoring Results
    raw_scores JSONB DEFAULT '{}',
    final_score INTEGER,
    score_percentile INTEGER,
    tier VARCHAR(50),
    segments JSONB DEFAULT '[]',
    
    -- AI Intelligence
    ai_insights JSONB DEFAULT '{
        "opportunities": [],
        "recommendations": [],
        "risk_factors": [],
        "conversation_starters": []
    }',
    predicted_value DECIMAL(10,2),
    conversion_probability DECIMAL(5,2),
    churn_risk DECIMAL(5,2),
    
    -- Business Status
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to VARCHAR(255),
    assignment_date TIMESTAMP,
    
    -- Communication
    last_contacted_at TIMESTAMP,
    contact_attempts INTEGER DEFAULT 0,
    preferred_contact_method VARCHAR(50),
    best_time_to_contact VARCHAR(50),
    
    -- Tags and Notes
    tags JSONB DEFAULT '[]',
    internal_notes TEXT,
    
    -- Source tracking
    source VARCHAR(100),
    medium VARCHAR(100),
    campaign VARCHAR(100),
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qualified_at TIMESTAMP,
    converted_at TIMESTAMP,
    lost_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_leads_tenant_email ON leads(tenant_id, email);
CREATE INDEX idx_leads_tenant_score ON leads(tenant_id, final_score DESC);
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- Question Bank (shared across verticals)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Question Content
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    help_text TEXT,
    placeholder TEXT,
    
    -- Options (for choice questions)
    options JSONB DEFAULT '[]',
    
    -- Validation rules
    validation JSONB DEFAULT '{
        "required": true,
        "min": null,
        "max": null,
        "pattern": null
    }',
    
    -- Skip logic
    skip_logic JSONB DEFAULT '[]',
    
    -- Scoring configuration
    scoring_dimensions JSONB DEFAULT '[]',
    scoring_weight DECIMAL(3,2) DEFAULT 1.0,
    
    -- Categorization
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags JSONB DEFAULT '[]',
    difficulty_level INTEGER DEFAULT 1,
    
    -- Vertical associations
    vertical_ids UUID[] DEFAULT '{}',
    
    -- A/B Testing
    variants JSONB DEFAULT '[]',
    is_control BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_question_type CHECK (question_type IN (
        'single-choice', 'multi-choice', 'text', 'email', 
        'phone', 'number', 'slider', 'date', 'scale', 'matrix'
    ))
);

-- Reports Generated
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    -- Report type and content
    report_type VARCHAR(50) NOT NULL,
    template_id VARCHAR(100),
    content JSONB NOT NULL,
    
    -- Access
    access_token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_report_type CHECK (report_type IN (
        'consumer', 'business', 'executive', 'custom'
    ))
);

-- Analytics Events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id),
    lead_id UUID REFERENCES leads(id),
    
    -- Event identification
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    event_value INTEGER,
    
    -- Event data
    event_data JSONB DEFAULT '{}',
    
    -- Context
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for analytics
CREATE INDEX idx_events_tenant_type ON analytics_events(tenant_id, event_type);
CREATE INDEX idx_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_events_session ON analytics_events(session_id);

-- A/B Test Experiments
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id VARCHAR(100) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    
    -- Experiment details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hypothesis TEXT,
    
    -- Configuration
    variants JSONB NOT NULL,
    traffic_allocation JSONB DEFAULT '{
        "control": 50,
        "variant": 50
    }',
    
    -- Targeting
    targeting_rules JSONB DEFAULT '{
        "segments": [],
        "conditions": []
    }',
    
    -- Metrics
    primary_metric VARCHAR(100),
    secondary_metrics JSONB DEFAULT '[]',
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Results
    results JSONB DEFAULT '{}',
    winner VARCHAR(50),
    confidence_level DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    
    CONSTRAINT valid_experiment_status CHECK (status IN (
        'draft', 'running', 'paused', 'completed', 'archived'
    ))
);

-- Webhooks Configuration
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Webhook details
    name VARCHAR(255),
    url TEXT NOT NULL,
    description TEXT,
    
    -- Events to trigger
    events JSONB NOT NULL DEFAULT '["lead.created"]',
    
    -- Headers and auth
    headers JSONB DEFAULT '{}',
    authentication JSONB DEFAULT '{}',
    
    -- Security
    secret VARCHAR(255),
    
    -- Retry configuration
    retry_attempts INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    
    -- Status and health
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP,
    last_status_code INTEGER,
    failure_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys (for SDK access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Key information
    key_id VARCHAR(100) UNIQUE NOT NULL,
    key_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    name VARCHAR(255),
    description TEXT,
    
    -- Permissions
    scopes JSONB DEFAULT '["read"]',
    allowed_origins JSONB DEFAULT '[]',
    allowed_ips JSONB DEFAULT '[]',
    
    -- Rate limiting
    rate_limit INTEGER DEFAULT 1000,
    rate_window_seconds INTEGER DEFAULT 3600,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    last_used_ip INET,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Integration Connections
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Integration details
    integration_type VARCHAR(50) NOT NULL,
    integration_name VARCHAR(100) NOT NULL,
    
    -- Configuration
    config JSONB NOT NULL DEFAULT '{}',
    credentials JSONB DEFAULT '{}', -- encrypted
    
    -- Sync settings
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency VARCHAR(50) DEFAULT 'real-time',
    last_sync_at TIMESTAMP,
    
    -- Field mappings
    field_mappings JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'connected',
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_integration_type CHECK (integration_type IN (
        'salesforce', 'hubspot', 'pipedrive', 'mailchimp', 
        'activecampaign', 'segment', 'mixpanel', 'slack', 'teams'
    ))
);

-- Behavioral Sessions
CREATE TABLE behavioral_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    lead_id UUID REFERENCES leads(id),
    
    -- Session data
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Device information
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    screen_resolution VARCHAR(20),
    
    -- Behavioral metrics
    total_clicks INTEGER DEFAULT 0,
    total_scrolls INTEGER DEFAULT 0,
    max_scroll_depth DECIMAL(5,2),
    rage_clicks INTEGER DEFAULT 0,
    dead_clicks INTEGER DEFAULT 0,
    
    -- Engagement metrics
    engagement_score INTEGER,
    trust_signals JSONB DEFAULT '[]',
    risk_signals JSONB DEFAULT '[]',
    
    -- Raw data (compressed)
    raw_events JSONB DEFAULT '[]'
);

-- Notification Queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Notification details
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    
    -- Content
    subject VARCHAR(255),
    content TEXT,
    template_id VARCHAR(100),
    template_data JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    
    -- Results
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP,
    
    CONSTRAINT valid_channel CHECK (channel IN (
        'email', 'sms', 'push', 'in-app', 'slack'
    ))
);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


