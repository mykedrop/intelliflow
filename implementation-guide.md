# OracleBrain Intelligence Platform - Complete Enterprise Implementation Guide
I have a complete implementation guide for building the OracleBrain Intelligence Platform. 

I've already:
1. Created the database schema in Supabase
2. Set up my .env file with all credentials
3. Installed express, cors, helmet, compression, dotenv, pg, and redis
4. I'm using port 8000 for the API and 8001 for WebSocket

Please create all the files and folder structure from this guide, starting with the core modules. Create each file in the exact path specified in the guide.


## Project Overview
A modular, multi-vertical intelligence platform that can be deployed anywhere to assess, score, and generate insights for any audience. This is not just an assessment tool - it's an intelligence-as-a-service platform that powers infinite use cases.

## Implementation Path
Starting from an empty folder at `~/Projects/intelliflow/`, this guide provides everything needed to build the complete platform from ground zero.

## Core Architecture
```
intelliflow/
├── core/                          # Core intelligence engine
│   ├── scoring-engine/           # Multi-dimensional scoring
│   ├── behavioral-intelligence/  # Behavioral tracking & analysis
│   ├── report-engine/           # Dynamic report generation
│   └── config-manager/          # Vertical & tenant configuration
├── api/                          # API Gateway
│   ├── routes/                  # RESTful endpoints
│   ├── websocket/              # Real-time streaming
│   ├── webhooks/               # Event dispatching
│   └── sdk-generator/          # Client library generation
├── database/                     # Multi-tenant database
│   ├── migrations/             # Database versioning
│   ├── schemas/                # Table definitions
│   └── seed-data/              # Initial configurations
├── verticals/                    # Industry configurations
│   ├── financial/              # Financial advisory
│   ├── hiring/                 # Recruitment & HR
│   ├── retention/              # Customer success
│   └── competitor/             # Competitive intelligence
├── deployment/                   # Deployment modes
│   ├── widget/                 # Embeddable widget
│   ├── iframe/                 # iFrame deployment
│   ├── wordpress/              # WordPress plugin
│   ├── shopify/                # Shopify app
│   └── salesforce/             # Salesforce package
├── integrations/                 # Third-party integrations
│   ├── crm/                    # CRM connectors
│   ├── marketing/              # Marketing platforms
│   └── analytics/              # Analytics tools
├── frontend/                     # Frontend applications
│   ├── assessment-ui/          # Assessment interface
│   ├── dashboard/              # Analytics dashboard
│   └── report-viewer/          # Report display
├── compliance/                   # Security & compliance
│   ├── gdpr/                   # GDPR compliance
│   ├── encryption/             # Data encryption
│   └── audit/                  # Audit logging
└── tests/                        # Test suites
```

## Step 1: Initialize Project

### Create Project Structure
```bash
cd ~/Projects/
mkdir intelliflow && cd intelliflow

# Create all directories
mkdir -p core/{scoring-engine,behavioral-intelligence,report-engine,config-manager}
mkdir -p api/{routes,websocket,webhooks,sdk-generator}
mkdir -p database/{migrations,schemas,seed-data}
mkdir -p verticals/{financial,hiring,retention,competitor}
mkdir -p deployment/{widget,iframe,wordpress,shopify,salesforce}
mkdir -p integrations/{crm,marketing,analytics}
mkdir -p frontend/{assessment-ui,dashboard,report-viewer}
mkdir -p compliance/{gdpr,encryption,audit}
mkdir -p tests/{unit,integration,e2e}
```

### Initialize Node.js Project
```bash
npm init -y

# Core dependencies
npm install express cors helmet compression dotenv
npm install pg redis bull uuid bcryptjs jsonwebtoken
npm install ws socket.io stripe sendgrid twilio
npm install @openai/api axios node-cron

# Dev dependencies
npm install --save-dev nodemon jest webpack
npm install --save-dev @types/node typescript
npm install --save-dev eslint prettier
```

## Step 2: Environment Configuration

### File: `.env`
```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
SERVER_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/oraclebrain
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-256-bit-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here
API_RATE_LIMIT=10000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Multi-tenant Configuration
ENABLE_MULTI_TENANT=true
DEFAULT_TENANT=default
TENANT_ISOLATION_MODE=schema

# Third-Party Services
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx
OPENAI_API_KEY=sk-xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx

# Analytics
SEGMENT_KEY=xxx
MIXPANEL_TOKEN=xxx
GOOGLE_ANALYTICS_ID=G-xxx

# AWS Storage
AWS_S3_BUCKET=oraclebrain-assets
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# Feature Flags
ENABLE_BEHAVIORAL_TRACKING=true
ENABLE_AB_TESTING=true
ENABLE_WEBHOOKS=true
ENABLE_REAL_TIME=true
```

## Step 3: Database Schema

### File: `database/schemas/complete-schema.sql`
```sql
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
```

## Step 4: Core Modules

### File: `core/config-manager/VerticalConfigManager.js`
```javascript
const fs = require('fs').promises;
const path = require('path');

class VerticalConfigManager {
    constructor() {
        this.verticals = new Map();
        this.customConfigs = new Map();
        this.loadDefaultVerticals();
    }

    async loadDefaultVerticals() {
        // Financial Advisory Vertical
        this.registerVertical('financial', {
            name: 'Financial Advisory Intelligence',
            description: 'Qualify and match prospects with financial advisors',
            icon: '💰',
            questions: [
                {
                    id: 'fin_priority',
                    text: "What's your #1 financial priority right now?",
                    type: 'single-choice',
                    options: [
                        { value: 'retirement', label: 'Planning for Retirement', weight: 1.2, icon: '🏖️' },
                        { value: 'taxes', label: 'Reducing Taxes', weight: 1.5, icon: '📊' },
                        { value: 'growth', label: 'Growing Wealth', weight: 1.0, icon: '📈' },
                        { value: 'protection', label: 'Protecting Family', weight: 1.3, icon: '🛡️' },
                        { value: 'estate', label: 'Estate Planning', weight: 1.4, icon: '🏛️' }
                    ],
                    scoringDimensions: ['urgency', 'sophistication']
                },
                {
                    id: 'fin_portfolio',
                    text: 'Current investment portfolio value?',
                    type: 'slider',
                    min: 0,
                    max: 10000000,
                    step: 50000,
                    format: 'currency',
                    scoringFunction: (value) => Math.min(value / 50000, 100),
                    scoringDimensions: ['financial_capacity']
                },
                {
                    id: 'fin_timeline',
                    text: 'When do you need to address this?',
                    type: 'single-choice',
                    options: [
                        { value: 'immediate', label: 'This Month', weight: 2.0 },
                        { value: 'quarter', label: 'This Quarter', weight: 1.5 },
                        { value: 'year', label: 'This Year', weight: 1.0 },
                        { value: 'exploring', label: 'Just Exploring', weight: 0.3 }
                    ],
                    scoringDimensions: ['urgency', 'intent']
                },
                {
                    id: 'fin_advisor',
                    text: 'Do you currently work with a financial advisor?',
                    type: 'single-choice',
                    options: [
                        { value: 'no', label: 'No', weight: 1.5 },
                        { value: 'yes_unhappy', label: 'Yes, but unhappy', weight: 2.0 },
                        { value: 'yes_happy', label: 'Yes, and happy', weight: 0.2 }
                    ],
                    scoringDimensions: ['opportunity']
                }
            ],
            scoringWeights: {
                financial_capacity: 0.25,
                urgency: 0.20,
                sophistication: 0.15,
                engagement: 0.15,
                intent: 0.15,
                behavioral: 0.10
            },
            tierThresholds: [
                { min: 90, name: 'DIAMOND', color: '#8B4789', icon: '💎' },
                { min: 80, name: 'PLATINUM', color: '#E5E4E2', icon: '🏆' },
                { min: 70, name: 'GOLD', color: '#FFD700', icon: '🥇' },
                { min: 60, name: 'SILVER', color: '#C0C0C0', icon: '🥈' },
                { min: 0, name: 'BRONZE', color: '#CD7F32', icon: '🥉' }
            ],
            behavioralMarkers: {
                highValue: [
                    'portfolio > 1000000',
                    'income > 500000',
                    'multiple_properties'
                ],
                urgentNeeds: [
                    'timeline = immediate',
                    'life_event_recent',
                    'tax_deadline_approaching'
                ],
                qualified: [
                    'score > 70',
                    'engagement > 80',
                    'complete_responses'
                ]
            },
            reportTemplates: {
                consumer: 'financial/consumer-wealth-report.html',
                advisor: 'financial/advisor-intelligence-dossier.html',
                executive: 'financial/executive-summary.html'
            }
        });

        // Hiring & Recruitment Vertical
        this.registerVertical('hiring', {
            name: 'Talent Intelligence Platform',
            description: 'Assess and match candidates with opportunities',
            icon: '🎯',
            questions: [
                {
                    id: 'hire_experience',
                    text: 'Years of relevant experience?',
                    type: 'single-choice',
                    options: [
                        { value: '0-2', label: 'Entry Level (0-2)', weight: 0.6 },
                        { value: '3-5', label: 'Mid Level (3-5)', weight: 1.0 },
                        { value: '6-10', label: 'Senior Level (6-10)', weight: 1.3 },
                        { value: '10+', label: 'Expert Level (10+)', weight: 1.5 }
                    ],
                    scoringDimensions: ['experience', 'seniority']
                },
                {
                    id: 'hire_skills',
                    text: 'Select your top 3 core competencies',
                    type: 'multi-choice',
                    maxSelections: 3,
                    options: [
                        { value: 'leadership', label: 'Leadership', weight: 1.3 },
                        { value: 'technical', label: 'Technical Excellence', weight: 1.2 },
                        { value: 'communication', label: 'Communication', weight: 1.1 },
                        { value: 'strategic', label: 'Strategic Thinking', weight: 1.4 },
                        { value: 'innovation', label: 'Innovation', weight: 1.2 },
                        { value: 'execution', label: 'Execution', weight: 1.3 }
                    ],
                    scoringDimensions: ['skills_match', 'competency']
                },
                {
                    id: 'hire_motivation',
                    text: 'Primary motivation for new opportunity?',
                    type: 'single-choice',
                    options: [
                        { value: 'growth', label: 'Career Growth', weight: 1.3 },
                        { value: 'compensation', label: 'Better Compensation', weight: 1.0 },
                        { value: 'culture', label: 'Company Culture', weight: 1.4 },
                        { value: 'challenge', label: 'New Challenges', weight: 1.5 },
                        { value: 'location', label: 'Location/Remote', weight: 0.8 }
                    ],
                    scoringDimensions: ['cultural_fit', 'retention_risk']
                }
            ],
            scoringWeights: {
                experience: 0.25,
                skills_match: 0.25,
                cultural_fit: 0.20,
                growth_potential: 0.15,
                retention_risk: 0.10,
                behavioral: 0.05
            },
            tierThresholds: [
                { min: 85, name: 'PERFECT_FIT', color: '#10B981', icon: '⭐' },
                { min: 70, name: 'STRONG_CANDIDATE', color: '#3B82F6', icon: '✓' },
                { min: 55, name: 'POTENTIAL', color: '#F59E0B', icon: '📊' },
                { min: 0, name: 'NOT_QUALIFIED', color: '#EF4444', icon: '✗' }
            ]
        });

        // Customer Retention Vertical
        this.registerVertical('retention', {
            name: 'Customer Success Intelligence',
            description: 'Predict churn and identify expansion opportunities',
            icon: '🔄',
            questions: [
                {
                    id: 'ret_satisfaction',
                    text: 'How satisfied are you with our product?',
                    type: 'scale',
                    min: 1,
                    max: 10,
                    labels: ['Very Unsatisfied', 'Very Satisfied'],
                    scoringDimensions: ['satisfaction', 'churn_risk']
                },
                {
                    id: 'ret_usage',
                    text: 'How often do you use our product?',
                    type: 'single-choice',
                    options: [
                        { value: 'daily', label: 'Daily', weight: 1.5 },
                        { value: 'weekly', label: 'Weekly', weight: 1.0 },
                        { value: 'monthly', label: 'Monthly', weight: 0.5 },
                        { value: 'rarely', label: 'Rarely', weight: 0.2 }
                    ],
                    scoringDimensions: ['engagement', 'value_realization']
                },
                {
                    id: 'ret_recommend',
                    text: 'How likely are you to recommend us? (NPS)',
                    type: 'scale',
                    min: 0,
                    max: 10,
                    scoringDimensions: ['advocacy', 'satisfaction']
                }
            ],
            scoringWeights: {
                satisfaction: 0.30,
                engagement: 0.25,
                value_realization: 0.20,
                advocacy: 0.15,
                behavioral: 0.10
            },
            tierThresholds: [
                { min: 80, name: 'CHAMPION', color: '#10B981', icon: '🏆' },
                { min: 60, name: 'SATISFIED', color: '#3B82F6', icon: '😊' },
                { min: 40, name: 'AT_RISK', color: '#F59E0B', icon: '⚠️' },
                { min: 0, name: 'CHURNING', color: '#EF4444', icon: '🚨' }
            ]
        });

        // Competitive Intelligence Vertical
        this.registerVertical('competitor', {
            name: 'Competitive Intelligence Engine',
            description: 'Understand competitor users and switch intent',
            icon: '🎯',
            questions: [
                {
                    id: 'comp_current',
                    text: 'What solution are you currently using?',
                    type: 'single-choice',
                    options: [
                        { value: 'competitor_a', label: 'Competitor A', weight: 1.5 },
                        { value: 'competitor_b', label: 'Competitor B', weight: 1.3 },
                        { value: 'in_house', label: 'In-house Solution', weight: 1.0 },
                        { value: 'none', label: 'No Solution Yet', weight: 2.0 }
                    ],
                    scoringDimensions: ['opportunity', 'switch_likelihood']
                },
                {
                    id: 'comp_pain',
                    text: 'Biggest pain point with current solution?',
                    type: 'single-choice',
                    options: [
                        { value: 'cost', label: 'Too Expensive', weight: 1.3 },
                        { value: 'features', label: 'Missing Features', weight: 1.5 },
                        { value: 'support', label: 'Poor Support', weight: 1.4 },
                        { value: 'performance', label: 'Performance Issues', weight: 1.6 },
                        { value: 'none', label: 'No Major Issues', weight: 0.3 }
                    ],
                    scoringDimensions: ['pain_severity', 'switch_likelihood']
                },
                {
                    id: 'comp_timeline',
                    text: 'When are you evaluating alternatives?',
                    type: 'single-choice',
                    options: [
                        { value: 'now', label: 'Actively Now', weight: 2.0 },
                        { value: 'quarter', label: 'This Quarter', weight: 1.5 },
                        { value: 'year', label: 'This Year', weight: 1.0 },
                        { value: 'future', label: 'Future Planning', weight: 0.4 }
                    ],
                    scoringDimensions: ['urgency', 'intent']
                }
            ],
            scoringWeights: {
                switch_likelihood: 0.30,
                pain_severity: 0.25,
                opportunity: 0.20,
                urgency: 0.15,
                behavioral: 0.10
            }
        });
    }

    registerVertical(id, config) {
        this.verticals.set(id, {
            id,
            ...config,
            createdAt: new Date(),
            version: '1.0.0'
        });
    }

    getVertical(id) {
        return this.verticals.get(id);
    }

    getAllVerticals() {
        return Array.from(this.verticals.values());
    }

    async saveVerticalConfig(tenantId, verticalId, customConfig) {
        const key = `${tenantId}-${verticalId}`;
        this.customConfigs.set(key, customConfig);
        
        // Persist to database
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        
        await pool.query(
            'UPDATE tenants SET config = jsonb_set(config, \'{verticals}\', $1) WHERE id = $2',
            [JSON.stringify(customConfig), tenantId]
        );
    }

    getVerticalForTenant(tenantId, verticalId) {
        const key = `${tenantId}-${verticalId}`;
        const customConfig = this.customConfigs.get(key);
        const baseConfig = this.getVertical(verticalId);
        
        if (!baseConfig) return null;
        
        // Merge custom config with base config
        return customConfig ? { ...baseConfig, ...customConfig } : baseConfig;
    }
}

module.exports = VerticalConfigManager;
```

### File: `core/scoring-engine/IntelligenceEngine.js`
```javascript
class IntelligenceEngine {
    constructor() {
        this.version = '3.0.0';
        this.algorithms = new Map();
        this.mlModels = new Map();
        this.loadAlgorithms();
    }

    loadAlgorithms() {
        // 12-Dimensional Scoring Algorithm
        this.algorithms.set('12-dimensional', {
            name: '12-Dimensional Intelligence Algorithm',
            dimensions: [
                'financial_capacity',
                'urgency',
                'sophistication',
                'engagement',
                'authority',
                'budget',
                'need',
                'timeline',
                'decision_process',
                'champion_strength',
                'technical_fit',
                'cultural_fit'
            ],
            calculate: async (responses, behaviorData, config) => {
                const scores = {};
                const weights = config.weights || this.getDefaultWeights();
                let totalScore = 0;

                // Calculate each dimension
                for (const dimension of this.algorithms.get('12-dimensional').dimensions) {
                    const score = await this.calculateDimension(
                        dimension, 
                        responses, 
                        behaviorData,
                        config
                    );
                    scores[dimension] = score;
                    totalScore += score * (weights[dimension] || 0.083);
                }

                // Apply behavioral modifiers
                const behavioralMultiplier = this.calculateBehavioralMultiplier(behaviorData);
                totalScore *= behavioralMultiplier;

                return {
                    algorithm: '12-dimensional',
                    totalScore: Math.round(Math.min(totalScore, 100)),
                    dimensionScores: scores,
                    behavioralMultiplier,
                    confidence: this.calculateConfidence(behaviorData),
                    timestamp: new Date().toISOString()
                };
            }
        });

        // ML Predictive Algorithm
        this.algorithms.set('ml-predictive', {
            name: 'Machine Learning Predictive Model',
            calculate: async (responses, behaviorData, config) => {
                // Feature extraction
                const features = this.extractFeatures(responses, behaviorData);
                
                // Model prediction (placeholder for actual ML integration)
                const predictions = await this.runMLModel(features, config.modelId);
                
                return {
                    algorithm: 'ml-predictive',
                    predictions: {
                        conversionProbability: predictions.conversion || 0.5,
                        lifetimeValue: predictions.ltv || 0,
                        churnRisk: predictions.churn || 0.2,
                        recommendedActions: predictions.actions || []
                    },
                    confidence: predictions.confidence || 0.7,
                    timestamp: new Date().toISOString()
                };
            }
        });

        // Behavioral Intelligence Algorithm
        this.algorithms.set('behavioral', {
            name: 'Deep Behavioral Analysis',
            calculate: async (responses, behaviorData) => {
                const analysis = {
                    engagementLevel: this.analyzeEngagement(behaviorData),
                    decisionPattern: this.analyzeDecisionPattern(behaviorData),
                    trustSignals: this.identifyTrustSignals(behaviorData),
                    riskSignals: this.identifyRiskSignals(behaviorData),
                    personalityMarkers: this.extractPersonalityMarkers(behaviorData),
                    cognitiveLoad: this.measureCognitiveLoad(behaviorData)
                };

                return {
                    algorithm: 'behavioral',
                    analysis,
                    score: this.behavioralScore(analysis),
                    insights: this.generateBehavioralInsights(analysis),
                    timestamp: new Date().toISOString()
                };
            }
        });
    }

    async calculateDimension(dimension, responses, behaviorData, config) {
        const calculators = {
            financial_capacity: () => {
                const portfolio = parseInt(responses.portfolio) || 0;
                const income = parseInt(responses.income) || 0;
                const assets = parseInt(responses.assets) || 0;
                
                let score = 0;
                score += Math.min(portfolio / 100000, 40);
                score += Math.min(income / 10000, 30);
                score += Math.min(assets / 200000, 30);
                
                return Math.min(score, 100);
            },
            
            urgency: () => {
                let score = 50;
                const timeline = responses.timeline || 'exploring';
                
                const timelineScores = {
                    'immediate': 100,
                    'this_month': 90,
                    'quarter': 75,
                    'year': 50,
                    'exploring': 25
                };
                
                score = timelineScores[timeline] || 50;
                
                // Behavioral urgency signals
                if (behaviorData.averageQuestionTime < 5000) score += 10;
                if (behaviorData.scrollDepth > 90) score += 10;
                
                return Math.min(score, 100);
            },
            
            sophistication: () => {
                let score = 40;
                
                // Response sophistication
                if (responses.experience === 'expert') score += 30;
                else if (responses.experience === 'advanced') score += 20;
                else if (responses.experience === 'intermediate') score += 10;
                
                // Technical sophistication
                if (behaviorData.device?.type === 'desktop') score += 10;
                if (behaviorData.device?.screenWidth > 1920) score += 10;
                
                // Interaction sophistication
                if (behaviorData.mouseMovements?.length > 100) score += 10;
                
                return Math.min(score, 100);
            },
            
            engagement: () => {
                let score = 0;
                
                // Time engagement
                const totalTime = behaviorData.totalTime || 0;
                if (totalTime > 60000) score += 30; // > 1 minute
                else if (totalTime > 30000) score += 20; // > 30 seconds
                else if (totalTime > 15000) score += 10; // > 15 seconds
                
                // Interaction engagement
                const interactions = behaviorData.totalInteractions || 0;
                score += Math.min(interactions * 2, 30);
                
                // Scroll engagement
                const scrollDepth = behaviorData.scrollDepth || 0;
                score += (scrollDepth / 100) * 20;
                
                // Focus engagement
                if (!behaviorData.tabSwitches || behaviorData.tabSwitches < 2) score += 20;
                
                return Math.min(score, 100);
            },
            
            authority: () => {
                const jobLevel = responses.jobLevel || 'individual';
                const decisionMaker = responses.decisionMaker === 'yes';
                
                const levelScores = {
                    'c_level': 100,
                    'vp': 85,
                    'director': 70,
                    'manager': 55,
                    'team_lead': 45,
                    'individual': 30
                };
                
                let score = levelScores[jobLevel] || 30;
                if (decisionMaker) score = Math.min(score * 1.2, 100);
                
                return score;
            },
            
            budget: () => {
                const budgetStatus = responses.budgetStatus || 'none';
                const budgetSize = parseInt(responses.budgetSize) || 0;
                
                const statusScores = {
                    'allocated': 100,
                    'approved': 85,
                    'requested': 60,
                    'planned': 40,
                    'exploring': 25,
                    'none': 10
                };
                
                let score = statusScores[budgetStatus] || 25;
                
                // Adjust for budget size
                if (budgetSize > 1000000) score = Math.min(score * 1.3, 100);
                else if (budgetSize > 100000) score = Math.min(score * 1.1, 100);
                
                return score;
            },
            
            need: () => {
                let score = 50;
                
                // Pain points
                const painPoints = responses.painPoints || [];
                score += painPoints.length * 10;
                
                // Current solution dissatisfaction
                if (responses.currentSolution === 'none') score += 20;
                else if (responses.satisfaction && responses.satisfaction < 5) score += 15;
                
                // Problem severity
                const severity = responses.problemSeverity || 'medium';
                const severityScores = {
                    'critical': 30,
                    'high': 20,
                    'medium': 10,
                    'low': 5
                };
                score += severityScores[severity] || 10;
                
                return Math.min(score, 100);
            },
            
            timeline: () => {
                const purchaseTimeline = responses.purchaseTimeline || 'exploring';
                const projectStart = responses.projectStart || 'future';
                
                const timelineScores = {
                    'immediate': 100,
                    'this_month': 85,
                    'this_quarter': 70,
                    'this_year': 50,
                    'next_year': 30,
                    'exploring': 15
                };
                
                return timelineScores[purchaseTimeline] || 
                       timelineScores[projectStart] || 25;
            },
            
            decision_process: () => {
                let score = 50;
                
                // Decision maker status
                if (responses.decisionMaker === 'yes') score += 30;
                else if (responses.decisionMaker === 'influence') score += 15;
                
                // Number of stakeholders (fewer is better for speed)
                const stakeholders = parseInt(responses.stakeholders) || 5;
                if (stakeholders <= 2) score += 20;
                else if (stakeholders <= 4) score += 10;
                
                // Approval process
                if (responses.approvalProcess === 'simple') score += 10;
                
                return Math.min(score, 100);
            },
            
            champion_strength: () => {
                let score = 40;
                
                // Advocacy willingness
                if (responses.willRecommend === 'yes') score += 30;
                if (responses.nps && responses.nps >= 9) score += 20;
                
                // Influence level
                const influence = responses.influence || 'medium';
                const influenceScores = {
                    'high': 30,
                    'medium': 15,
                    'low': 5
                };
                score += influenceScores[influence] || 15;
                
                return Math.min(score, 100);
            },
            
            technical_fit: () => {
                const requirements = responses.requirements || [];
                const techStack = responses.techStack || [];
                const integrations = responses.integrations || [];
                
                let score = 50;
                
                // Requirements match
                const ourCapabilities = config.capabilities || [];
                const matchedReqs = requirements.filter(r => ourCapabilities.includes(r));
                score += (matchedReqs.length / Math.max(requirements.length, 1)) * 30;
                
                // Tech stack compatibility
                const compatibleTech = config.compatibleTech || [];
                const matchedTech = techStack.filter(t => compatibleTech.includes(t));
                score += (matchedTech.length / Math.max(techStack.length, 1)) * 20;
                
                return Math.min(score, 100);
            },
            
            cultural_fit: () => {
                let score = 50;
                
                const values = responses.companyValues || [];
                const workStyle = responses.workStyle || 'balanced';
                const priorities = responses.priorities || [];
                
                // Value alignment
                const ourValues = config.companyValues || ['innovation', 'excellence', 'integrity'];
                const alignedValues = values.filter(v => ourValues.includes(v));
                score += (alignedValues.length / Math.max(values.length, 1)) * 30;
                
                // Work style match
                const styleScores = {
                    'fast_paced': 20,
                    'balanced': 15,
                    'methodical': 10
                };
                score += styleScores[workStyle] || 15;
                
                return Math.min(score, 100);
            }
        };

        const calculator = calculators[dimension];
        return calculator ? calculator() : 50;
    }

    calculateBehavioralMultiplier(behaviorData) {
        let multiplier = 1.0;
        
        // Quick, confident responses
        if (behaviorData.averageQuestionTime > 3000 && 
            behaviorData.averageQuestionTime < 15000) {
            multiplier += 0.05;
        }
        
        // Low hesitation
        if (behaviorData.hesitations && behaviorData.hesitations < 2) {
            multiplier += 0.05;
        }
        
        // High completion
        if (behaviorData.completionRate > 90) {
            multiplier += 0.05;
        }
        
        // No rage clicks
        if (!behaviorData.rageClicks || behaviorData.rageClicks === 0) {
            multiplier += 0.05;
        }
        
        return Math.min(multiplier, 1.2);
    }

    calculateConfidence(behaviorData) {
        let confidence = 70;
        
        // Data completeness
        if (behaviorData.completionRate > 95) confidence += 10;
        else if (behaviorData.completionRate > 80) confidence += 5;
        
        // Response consistency
        if (behaviorData.corrections && behaviorData.corrections < 2) confidence += 10;
        
        // Engagement quality
        if (behaviorData.engagementScore > 80) confidence += 10;
        
        return Math.min(confidence, 100);
    }

    analyzeEngagement(behaviorData) {
        const factors = {
            timeOnPage: behaviorData.totalTime || 0,
            scrollDepth: behaviorData.scrollDepth || 0,
            interactions: behaviorData.totalInteractions || 0,
            focusTime: behaviorData.focusTime || 0,
            mouseActivity: behaviorData.mouseMovements?.length || 0
        };
        
        // Calculate engagement score
        let score = 0;
        if (factors.timeOnPage > 30000) score += 25;
        if (factors.scrollDepth > 75) score += 25;
        if (factors.interactions > 10) score += 20;
        if (factors.focusTime > factors.timeOnPage * 0.8) score += 20;
        if (factors.mouseActivity > 50) score += 10;
        
        return {
            score,
            level: score > 80 ? 'high' : score > 50 ? 'medium' : 'low',
            factors
        };
    }

    analyzeDecisionPattern(behaviorData) {
        const patterns = [];
        
        // Identify decision-making patterns
        if (behaviorData.averageQuestionTime < 5000) {
            patterns.push('quick_decision_maker');
        }
        
        if (behaviorData.corrections && behaviorData.corrections > 3) {
            patterns.push('deliberative');
        }
        
        if (behaviorData.scrollReturns && behaviorData.scrollReturns > 2) {
            patterns.push('thorough_reviewer');
        }
        
        if (behaviorData.hesitations && behaviorData.hesitations.length > 0) {
            patterns.push('cautious');
        }
        
        return patterns;
    }

    identifyTrustSignals(behaviorData) {
        const signals = [];
        
        if (behaviorData.corrections && behaviorData.corrections < 2) {
            signals.push('confident_responses');
        }
        
        if (behaviorData.completionRate > 90) {
            signals.push('high_commitment');
        }
        
        if (behaviorData.scrollDepth > 80) {
            signals.push('thorough_review');
        }
        
        if (!behaviorData.rageClicks || behaviorData.rageClicks === 0) {
            signals.push('smooth_experience');
        }
        
        if (behaviorData.returnVisit) {
            signals.push('return_visitor');
        }
        
        return signals;
    }

    identifyRiskSignals(behaviorData) {
        const signals = [];
        
        if (behaviorData.averageQuestionTime < 2000) {
            signals.push('rushing_through');
        }
        
        if (behaviorData.corrections && behaviorData.corrections > 5) {
            signals.push('high_uncertainty');
        }
        
        if (behaviorData.rageClicks && behaviorData.rageClicks > 0) {
            signals.push('frustration_detected');
        }
        
        if (behaviorData.tabSwitches && behaviorData.tabSwitches > 5) {
            signals.push('distracted');
        }
        
        if (behaviorData.incompleteFields && behaviorData.incompleteFields > 2) {
            signals.push('low_commitment');
        }
        
        return signals;
    }

    extractPersonalityMarkers(behaviorData) {
        const markers = [];
        
        // Analytical vs Intuitive
        if (behaviorData.hoverTime && behaviorData.hoverTime > 10000) {
            markers.push('analytical');
        } else if (behaviorData.averageQuestionTime < 5000) {
            markers.push('intuitive');
        }
        
        // Detail-oriented vs Big-picture
        if (behaviorData.scrollReturns && behaviorData.scrollReturns > 3) {
            markers.push('detail_oriented');
        }
        
        // Risk tolerance
        if (behaviorData.skipOptional && behaviorData.skipOptional > 0.5) {
            markers.push('efficiency_focused');
        }
        
        return markers;
    }

    measureCognitiveLoad(behaviorData) {
        let load = 'normal';
        
        const indicators = {
            highPauseTime: behaviorData.maxPauseTime > 30000,
            manyCorrections: behaviorData.corrections > 4,
            longHesitations: behaviorData.hesitations?.some(h => h.duration > 15000),
            frequentScrolling: behaviorData.scrollEvents > 20
        };
        
        const highLoadCount = Object.values(indicators).filter(v => v).length;
        
        if (highLoadCount >= 3) load = 'high';
        else if (highLoadCount >= 1) load = 'moderate';
        else load = 'low';
        
        return { load, indicators };
    }

    behavioralScore(analysis) {
        let score = 50;
        
        // Engagement contribution
        score += analysis.engagementLevel.score * 0.3;
        
        // Trust signals boost
        score += analysis.trustSignals.length * 5;
        
        // Risk signals penalty
        score -= analysis.riskSignals.length * 5;
        
        // Cognitive load adjustment
        if (analysis.cognitiveLoad.load === 'low') score += 10;
        else if (analysis.cognitiveLoad.load === 'high') score -= 10;
        
        return Math.max(0, Math.min(100, score));
    }

    generateBehavioralInsights(analysis) {
        const insights = [];
        
        // Engagement insights
        if (analysis.engagementLevel.level === 'high') {
            insights.push({
                type: 'positive',
                message: 'Highly engaged prospect - prioritize for immediate follow-up'
            });
        }
        
        // Decision pattern insights
        if (analysis.decisionPattern.includes('quick_decision_maker')) {
            insights.push({
                type: 'tactical',
                message: 'Fast decision maker - emphasize key benefits quickly'
            });
        }
        
        // Risk insights
        if (analysis.riskSignals.includes('rushing_through')) {
            insights.push({
                type: 'warning',
                message: 'May be providing surface-level responses - verify interest'
            });
        }
        
        // Personality insights
        if (analysis.personalityMarkers.includes('analytical')) {
            insights.push({
                type: 'approach',
                message: 'Analytical personality - provide detailed data and proof points'
            });
        }
        
        return insights;
    }

    extractFeatures(responses, behaviorData) {
        // Extract features for ML model
        return {
            // Response features
            responseCompleteness: Object.keys(responses).length,
            ...responses,
            
            // Behavioral features
            totalTime: behaviorData.totalTime,
            scrollDepth: behaviorData.scrollDepth,
            interactions: behaviorData.totalInteractions,
            corrections: behaviorData.corrections,
            hesitations: behaviorData.hesitations?.length || 0,
            
            // Device features
            deviceType: behaviorData.device?.type,
            screenSize: behaviorData.device?.screenWidth,
            
            // Temporal features
            hourOfDay: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };
    }

    async runMLModel(features, modelId) {
        // Placeholder for ML model integration
        // In production, this would call your ML service
        
        // Mock prediction
        return {
            conversion: 0.65 + Math.random() * 0.3,
            ltv: Math.random() * 100000,
            churn: Math.random() * 0.3,
            confidence: 0.75 + Math.random() * 0.2,
            actions: [
                'Schedule demo within 24 hours',
                'Assign to senior sales rep',
                'Include executive in first call'
            ]
        };
    }

    getDefaultWeights() {
        return {
            financial_capacity: 0.10,
            urgency: 0.10,
            sophistication: 0.08,
            engagement: 0.08,
            authority: 0.09,
            budget: 0.09,
            need: 0.09,
            timeline: 0.08,
            decision_process: 0.08,
            champion_strength: 0.07,
            technical_fit: 0.07,
            cultural_fit: 0.07
        };
    }

    async score(responses, behaviorData, config = {}) {
        const algorithm = config.algorithm || '12-dimensional';
        const scorer = this.algorithms.get(algorithm);
        
        if (!scorer) {
            throw new Error(`Algorithm ${algorithm} not found`);
        }
        
        const result = await scorer.calculate(responses, behaviorData, config);
        
        // Add tier classification
        result.tier = this.determineTier(result.totalScore, config.vertical);
        
        // Add actionable insights
        result.insights = await this.generateInsights(result, responses, behaviorData);
        
        // Add recommendations
        result.recommendations = await this.generateRecommendations(result);
        
        return result;
    }

    determineTier(score, vertical) {
        // Default tiers, can be customized per vertical
        const tiers = [
            { min: 90, name: 'ELITE', icon: '💎' },
            { min: 80, name: 'PREMIUM', icon: '🏆' },
            { min: 70, name: 'HIGH', icon: '🥇' },
            { min: 60, name: 'MEDIUM', icon: '🥈' },
            { min: 40, name: 'LOW', icon: '🥉' },
            { min: 0, name: 'ENTRY', icon: '📊' }
        ];
        
        return tiers.find(tier => score >= tier.min);
    }

    async generateInsights(result, responses, behaviorData) {
        const insights = [];
        
        // Score-based insights
        if (result.totalScore > 85) {
            insights.push({
                type: 'priority',
                title: 'High-Value Prospect',
                message: 'This lead scores in the top 10% - immediate action recommended'
            });
        }
        
        // Dimension-specific insights
        Object.entries(result.dimensionScores).forEach(([dimension, score]) => {
            if (score > 80) {
                insights.push({
                    type: 'strength',
                    dimension,
                    message: `Strong ${dimension} indicator (${score}/100)`
                });
            } else if (score < 40) {
                insights.push({
                    type: 'concern',
                    dimension,
                    message: `Low ${dimension} score may impact conversion`
                });
            }
        });
        
        // Behavioral insights
        if (behaviorData.engagementScore > 80) {
            insights.push({
                type: 'behavioral',
                title: 'High Engagement',
                message: 'Prospect showed strong interest through interaction patterns'
            });
        }
        
        return insights;
    }
    
    async generateRecommendations(result) {
        const recommendations = [];
        
        if (result.totalScore > 80) {
            recommendations.push('Assign to senior sales representative');
            recommendations.push('Schedule follow-up within 2 hours');
            recommendations.push('Prepare custom demo focused on identified needs');
        } else if (result.totalScore > 60) {
            recommendations.push('Add to nurture campaign');
            recommendations.push('Send relevant case studies');
            recommendations.push('Schedule follow-up within 24 hours');
        } else {
            recommendations.push('Add to long-term nurture sequence');
            recommendations.push('Monitor for engagement signals');
        }
        
        return recommendations;
    }
}

module.exports = IntelligenceEngine;
```

### File: `core/behavioral-intelligence/BehavioralTracker.js`
```javascript
class BehavioralTracker {
    constructor(sessionId) {
        this.session = {
            id: sessionId || this.generateSessionId(),
            startTime: Date.now(),
            events: [],
            mouseMovements: [],
            keystrokes: [],
            scrollEvents: [],
            focusEvents: [],
            hesitations: [],
            corrections: [],
            fieldInteractions: [],
            device: this.getDeviceProfile()
        };
        this.currentQuestion = null;
        this.questionTimings = [];
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getDeviceProfile() {
        if (typeof window === 'undefined') {
            return { type: 'server', environment: 'node' };
        }
        
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen?.width,
            screenHeight: window.screen?.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            touchPoints: navigator.maxTouchPoints,
            type: this.detectDeviceType()
        };
    }

    detectDeviceType() {
        if (typeof window === 'undefined') return 'server';
        
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    startTracking() {
        if (typeof window === 'undefined') return;
        
        this.trackMouseMovements();
        this.trackKeystrokes();
        this.trackScrollBehavior();
        this.trackFocusEvents();
        this.trackVisibility();
        this.trackRageClicks();
        this.trackFormInteractions();
        this.trackCopyPaste();
        this.trackNetworkSpeed();
    }

    trackMouseMovements() {
        let lastMove = Date.now();
        let movements = [];
        let heatmapData = {};

        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMove > 100) { // Throttle to 10fps
                const point = {
                    x: e.clientX,
                    y: e.clientY,
                    t: now - this.session.startTime
                };
                
                movements.push(point);
                
                // Update heatmap
                const gridX = Math.floor(e.clientX / 50);
                const gridY = Math.floor(e.clientY / 50);
                const key = `${gridX},${gridY}`;
                heatmapData[key] = (heatmapData[key] || 0) + 1;
                
                // Keep only last 200 movements
                if (movements.length > 200) {
                    movements = movements.slice(-200);
                }
                
                this.session.mouseMovements = movements;
                this.session.heatmap = heatmapData;
                lastMove = now;
            }
        });
        
        // Track mouse velocity for engagement analysis
        this.trackMouseVelocity();
    }

    trackMouseVelocity() {
        let lastX = 0, lastY = 0, lastTime = Date.now();
        let velocities = [];
        
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            const timeDelta = now - lastTime;
            
            if (timeDelta > 50) { // Sample every 50ms
                const distance = Math.sqrt(
                    Math.pow(e.clientX - lastX, 2) + 
                    Math.pow(e.clientY - lastY, 2)
                );
                const velocity = distance / timeDelta;
                
                velocities.push({
                    v: velocity,
                    t: now - this.session.startTime
                });
                
                // Keep only last 100 velocities
                if (velocities.length > 100) {
                    velocities = velocities.slice(-100);
                }
                
                this.session.mouseVelocities = velocities;
                
                lastX = e.clientX;
                lastY = e.clientY;
                lastTime = now;
            }
        });
    }

    trackKeystrokes() {
        let lastKeyTime = Date.now();
        let keystrokeTimings = [];
        let typingPatterns = {
            bursts: 0,
            pauses: 0,
            corrections: 0
        };

        document.addEventListener('keydown', (e) => {
            const now = Date.now();
            const timeSinceLastKey = now - lastKeyTime;
            
            // Track typing cadence
            if (timeSinceLastKey < 10000) {
                keystrokeTimings.push(timeSinceLastKey);
                
                // Detect typing patterns
                if (timeSinceLastKey < 200) typingPatterns.bursts++;
                else if (timeSinceLastKey > 2000) typingPatterns.pauses++;
            }
            
            // Track corrections
            if (e.key === 'Backspace' || e.key === 'Delete') {
                typingPatterns.corrections++;
                this.session.corrections.push({
                    time: now - this.session.startTime,
                    field: e.target?.name || e.target?.id
                });
            }
            
            // Track special keys
            if (e.key === 'Tab') {
                this.session.events.push({
                    type: 'tab_navigation',
                    time: now - this.session.startTime
                });
            }
            
            lastKeyTime = now;
        });
        
        this.session.typingPatterns = typingPatterns;
        this.session.keystrokeTimings = keystrokeTimings;
    }

    trackScrollBehavior() {
        let maxScroll = 0;
        let scrollEvents = [];
        let scrollReturns = 0;
        let lastScrollTop = 0;

        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            
            // Track scroll returns (going back up)
            if (scrollTop < lastScrollTop - 100) {
                scrollReturns++;
            }
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            scrollEvents.push({
                percent: scrollPercent,
                direction: scrollTop > lastScrollTop ? 'down' : 'up',
                time: Date.now() - this.session.startTime
            });
            
            // Keep only last 100 scroll events
            if (scrollEvents.length > 100) {
                scrollEvents = scrollEvents.slice(-100);
            }
            
            this.session.scrollEvents = scrollEvents;
            this.session.maxScrollDepth = maxScroll;
            this.session.scrollReturns = scrollReturns;
            
            lastScrollTop = scrollTop;
        };
        
        // Throttled scroll handler
        let scrollTimeout;
        document.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(handleScroll, 100);
        });
    }

    trackFocusEvents() {
        let lastFocusTime = Date.now();
        let totalFocusTime = 0;
        let tabSwitches = 0;

        document.addEventListener('focus', (e) => {
            const now = Date.now();
            
            this.session.focusEvents.push({
                type: 'focus',
                target: e.target?.name || e.target?.id,
                time: now - this.session.startTime
            });
            
            lastFocusTime = now;
        }, true);

        document.addEventListener('blur', (e) => {
            const now = Date.now();
            const focusDuration = now - lastFocusTime;
            
            totalFocusTime += focusDuration;
            
            this.session.focusEvents.push({
                type: 'blur',
                target: e.target?.name || e.target?.id,
                time: now - this.session.startTime,
                duration: focusDuration
            });
            
            this.session.totalFocusTime = totalFocusTime;
        }, true);
        
        // Track tab switches
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                tabSwitches++;
                this.session.tabSwitches = tabSwitches;
            }
        });
    }

    trackVisibility() {
        let hiddenTime = 0;
        let lastHidden = null;
        let visibilityChanges = 0;

        document.addEventListener('visibilitychange', () => {
            const now = Date.now();
            visibilityChanges++;
            
            if (document.hidden) {
                lastHidden = now;
                this.session.events.push({
                    type: 'page_hidden',
                    time: now - this.session.startTime
                });
            } else if (lastHidden) {
                const hiddenDuration = now - lastHidden;
                hiddenTime += hiddenDuration;
                
                this.session.totalHiddenTime = hiddenTime;
                this.session.visibilityChanges = visibilityChanges;
                
                this.session.events.push({
                    type: 'page_visible',
                    time: now - this.session.startTime,
                    hiddenDuration
                });
            }
        });
    }

    trackRageClicks() {
        let clicks = [];
        let rageClicks = 0;
        let deadClicks = 0;

        document.addEventListener('click', (e) => {
            const now = Date.now();
            const click = {
                time: now,
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName
            };
            
            clicks.push(click);
            
            // Check for rage clicks (3+ clicks within 1 second in same area)
            const recentClicks = clicks.filter(c => now - c.time < 1000);
            
            if (recentClicks.length >= 3) {
                const avgX = recentClicks.reduce((sum, c) => sum + c.x, 0) / recentClicks.length;
                const avgY = recentClicks.reduce((sum, c) => sum + c.y, 0) / recentClicks.length;
                
                const isRageClick = recentClicks.every(c => 
                    Math.abs(c.x - avgX) < 50 && Math.abs(c.y - avgY) < 50
                );
                
                if (isRageClick) {
                    rageClicks++;
                    this.session.rageClicks = rageClicks;
                    
                    this.session.events.push({
                        type: 'rage_click',
                        time: now - this.session.startTime,
                        location: { x: avgX, y: avgY },
                        count: recentClicks.length
                    });
                }
            }
            
            // Check for dead clicks (clicks on non-interactive elements)
            if (!e.target.onclick && 
                !e.target.href && 
                e.target.tagName !== 'BUTTON' && 
                e.target.tagName !== 'A' &&
                e.target.tagName !== 'INPUT') {
                deadClicks++;
                this.session.deadClicks = deadClicks;
            }
            
            // Clean old clicks
            clicks = clicks.filter(c => now - c.time < 5000);
        });
    }

    trackFormInteractions() {
        const formFields = document.querySelectorAll('input, select, textarea');
        
        formFields.forEach(field => {
            let startTime = null;
            let changeCount = 0;
            let previousValue = '';

            field.addEventListener('focus', () => {
                startTime = Date.now();
                previousValue = field.value;
            });

            field.addEventListener('blur', () => {
                if (startTime) {
                    const duration = Date.now() - startTime;
                    const changed = field.value !== previousValue;
                    
                    this.session.fieldInteractions.push({
                        field: field.name || field.id,
                        type: field.type,
                        duration,
                        changed,
                        changeCount,
                        completed: !!field.value,
                        time: Date.now() - this.session.startTime
                    });
                    
                    // Detect hesitation
                    if (duration > 10000) {
                        this.session.hesitations.push({
                            field: field.name || field.id,
                            duration,
                            time: Date.now() - this.session.startTime
                        });
                    }
                }
            });

            field.addEventListener('input', () => {
                changeCount++;
            });
        });
    }

    trackCopyPaste() {
        let copyEvents = 0;
        let pasteEvents = 0;
        
        document.addEventListener('copy', () => {
            copyEvents++;
            this.session.copyEvents = copyEvents;
        });
        
        document.addEventListener('paste', (e) => {
            pasteEvents++;
            this.session.pasteEvents = pasteEvents;
            
            this.session.events.push({
                type: 'paste',
                field: e.target?.name || e.target?.id,
                time: Date.now() - this.session.startTime
            });
        });
    }

    trackNetworkSpeed() {
        if (typeof navigator !== 'undefined' && navigator.connection) {
            this.session.networkInfo = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
    }

    trackQuestionStart(questionId) {
        this.currentQuestion = {
            id: questionId,
            startTime: Date.now()
        };
    }

    trackQuestionComplete(questionId, answer) {
        if (this.currentQuestion && this.currentQuestion.id === questionId) {
            const duration = Date.now() - this.currentQuestion.startTime;
            
            this.questionTimings.push({
                questionId,
                answer,
                duration,
                time: Date.now() - this.session.startTime
            });
            
            this.session.events.push({
                type: 'question_completed',
                questionId,
                duration
            });
            
            return duration;
        }
        return null;
    }

    getSessionData() {
        const now = Date.now();
        const totalTime = now - this.session.startTime;
        
        return {
            ...this.session,
            totalTime,
            questionTimings: this.questionTimings,
            averageQuestionTime: this.calculateAverageQuestionTime(),
            completionRate: this.calculateCompletionRate(),
            engagementScore: this.calculateEngagement(),
            trustSignals: this.identifyTrustSignals(),
            riskSignals: this.identifyRiskSignals(),
            behaviorProfile: this.generateBehaviorProfile()
        };
    }

    calculateAverageQuestionTime() {
        if (this.questionTimings.length === 0) return 0;
        
        const total = this.questionTimings.reduce((sum, q) => sum + q.duration, 0);
        return Math.round(total / this.questionTimings.length);
    }

    calculateCompletionRate() {
        const totalFields = document.querySelectorAll('input, select, textarea').length;
        const completedFields = Array.from(document.querySelectorAll('input, select, textarea'))
            .filter(field => field.value).length;
        
        return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    }

    calculateEngagement() {
        const factors = {
            timeOnPage: Math.min((Date.now() - this.session.startTime) / 60000, 1),
            scrollDepth: (this.session.maxScrollDepth || 0) / 100,
            interactions: Math.min((this.session.events?.length || 0) / 20, 1),
            focusTime: this.session.totalFocusTime ? 
                Math.min(this.session.totalFocusTime / (Date.now() - this.session.startTime), 1) : 0.5,
            mouseActivity: Math.min((this.session.mouseMovements?.length || 0) / 100, 1)
        };
        
        const weights = {
            timeOnPage: 0.20,
            scrollDepth: 0.20,
            interactions: 0.20,
            focusTime: 0.20,
            mouseActivity: 0.20
        };
        
        let engagement = 0;
        Object.entries(factors).forEach(([factor, value]) => {
            engagement += value * weights[factor];
        });
        
        return Math.round(engagement * 100);
    }

    identifyTrustSignals() {
        const signals = [];
        
        if (this.session.corrections && this.session.corrections.length < 3) {
            signals.push('low_corrections');
        }
        
        if (this.calculateAverageQuestionTime() > 3000 && 
            this.calculateAverageQuestionTime() < 30000) {
            signals.push('thoughtful_responses');
        }
        
        if (this.session.maxScrollDepth > 75) {
            signals.push('high_scroll_engagement');
        }
        
        if (!this.session.rageClicks || this.session.rageClicks === 0) {
            signals.push('smooth_interaction');
        }
        
        if (this.session.totalFocusTime > (Date.now() - this.session.startTime) * 0.8) {
            signals.push('high_focus');
        }
        
        if (this.calculateCompletionRate() > 90) {
            signals.push('high_completion');
        }
        
        return signals;
    }

    identifyRiskSignals() {
        const signals = [];
        
        if (this.calculateAverageQuestionTime() < 2000) {
            signals.push('rushing_through');
        }
        
        if (this.session.corrections && this.session.corrections.length > 5) {
            signals.push('high_uncertainty');
        }
        
        if (this.session.rageClicks && this.session.rageClicks > 0) {
            signals.push('frustration_detected');
        }
        
        if (this.session.tabSwitches && this.session.tabSwitches > 5) {
            signals.push('high_distraction');
        }
        
        if (this.session.hesitations && this.session.hesitations.length > 3) {
            signals.push('high_hesitation');
        }
        
        if (this.session.pasteEvents && this.session.pasteEvents > 2) {
            signals.push('potential_automation');
        }
        
        return signals;
    }

    generateBehaviorProfile() {
        return {
            engagementLevel: this.calculateEngagement() > 70 ? 'high' : 
                           this.calculateEngagement() > 40 ? 'medium' : 'low',
            decisionSpeed: this.calculateAverageQuestionTime() < 5000 ? 'fast' :
                          this.calculateAverageQuestionTime() < 15000 ? 'moderate' : 'slow',
            confidence: this.session.corrections?.length < 2 ? 'high' :
                       this.session.corrections?.length < 5 ? 'medium' : 'low',
            thoroughness: this.session.scrollDepth > 80 ? 'high' :
                         this.session.scrollDepth > 50 ? 'medium' : 'low',
            deviceType: this.session.device?.type,
            trustScore: this.identifyTrustSignals().length - this.identifyRiskSignals().length
        };
    }
}

module.exports = BehavioralTracker;