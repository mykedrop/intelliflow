-- assessment-system/backend/database/schema-postgres.sql

-- Northwestern Mutual Enhanced Assessment System Database Schema (PostgreSQL)

-- Create database (run this as superuser)
-- CREATE DATABASE nm_assessment_system;
-- \c nm_assessment_system;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assessment sessions table
CREATE TABLE assessment_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    assessment_id VARCHAR(100) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'abandoned')),
    total_duration INTEGER DEFAULT 0, -- in seconds
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact information table
CREATE TABLE candidate_contacts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    linkedin_url VARCHAR(500),
    experience_level VARCHAR(10) NOT NULL CHECK (experience_level IN ('0-1', '1-3', '3-5', '5-10', '10+')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Behavioral data table
CREATE TABLE behavioral_data (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('mouse_movement', 'click_pattern', 'typing_pattern', 'navigation', 'stress_indicator', 'confidence_score')),
    data_json JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Question responses table
CREATE TABLE question_responses (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('scenario', 'timed_response', 'email_simulation', 'drag_drop', 'slider_matrix', 'rapid_fire', 'day_simulation')),
    response_value TEXT,
    response_metadata JSONB,
    response_time INTEGER, -- in milliseconds
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Contradictions table
CREATE TABLE contradictions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    contradiction_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    questions_involved JSONB NOT NULL, -- Array of question IDs
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Assessment scores table
CREATE TABLE assessment_scores (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    score_type VARCHAR(50) NOT NULL CHECK (score_type IN ('overall', 'behavioral', 'response', 'ethical', 'decision_making', 'communication', 'problem_solving', 'teamwork')),
    score_value DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    score_breakdown JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    UNIQUE (session_id, score_type)
);

-- Candidate profiles table
CREATE TABLE candidate_profiles (
    id SERIAL PRIMARY KEY,
    profile_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    overall_score DECIMAL(5,2) NOT NULL,
    behavioral_score DECIMAL(5,2),
    response_score DECIMAL(5,2),
    profile_data JSONB NOT NULL, -- Complete profile data
    recommendation VARCHAR(20) NOT NULL CHECK (recommendation IN ('strong_hire', 'hire', 'conditional', 'no_hire')),
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
    risk_indicators JSONB,
    strengths JSONB,
    development_areas JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Flow adaptations table
CREATE TABLE flow_adaptations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    adaptation_type VARCHAR(100) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adaptation_data JSONB,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Analytics summary table
CREATE TABLE analytics_summary (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_assessments INTEGER DEFAULT 0,
    completed_assessments INTEGER DEFAULT 0,
    abandoned_assessments INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    average_completion_time INTEGER, -- in seconds
    stress_levels JSONB, -- Distribution of stress levels
    confidence_levels JSONB, -- Distribution of confidence levels
    ethical_concerns INTEGER DEFAULT 0,
    contradictions_detected INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (date)
);

-- Recruiter notifications table
CREATE TABLE recruiter_notifications (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('assessment_completed', 'high_score', 'ethical_concern', 'contradiction_detected')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    message TEXT NOT NULL,
    data JSONB,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE
);

-- Assessment questions metadata table
CREATE TABLE assessment_questions (
    id SERIAL PRIMARY KEY,
    question_id VARCHAR(100) UNIQUE NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('scenario', 'timed_response', 'email_simulation', 'drag_drop', 'slider_matrix', 'rapid_fire', 'day_simulation')),
    category VARCHAR(100),
    difficulty_level VARCHAR(20) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    options JSONB,
    correct_answer VARCHAR(255),
    scoring_rubric JSONB,
    behavior_tracking JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration table
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('assessment_timeout_minutes', '120', 'number', 'Maximum time allowed for assessment completion'),
('confidence_update_interval', '1000', 'number', 'Interval in milliseconds for confidence score updates'),
('stress_detection_threshold', '60', 'number', 'Threshold score for high stress detection'),
('ethical_concern_threshold', '70', 'number', 'Minimum score required for ethical integrity'),
('tab_switch_penalty', '5', 'number', 'Confidence penalty for each tab switch'),
('dev_tools_penalty', '50', 'number', 'Confidence penalty for developer tools detection'),
('assessment_phases', '["contact","warmup","psychological","contradiction_check","simulation","rapid_fire","day_simulation"]', 'json', 'Assessment flow phases'),
('scoring_weights', '{"ethical_integrity":0.30,"stress_resilience":0.25,"client_focus":0.20,"consistency":0.15,"adaptability":0.10}', 'json', 'Scoring weights for different dimensions');

-- Create indexes for performance
CREATE INDEX idx_assessment_sessions_candidate_email ON assessment_sessions(candidate_email);
CREATE INDEX idx_assessment_sessions_status ON assessment_sessions(status);
CREATE INDEX idx_assessment_sessions_start_time ON assessment_sessions(start_time);
CREATE INDEX idx_candidate_contacts_session_id ON candidate_contacts(session_id);
CREATE INDEX idx_candidate_contacts_email ON candidate_contacts(email);
CREATE INDEX idx_behavioral_data_session_id ON behavioral_data(session_id);
CREATE INDEX idx_behavioral_data_data_type ON behavioral_data(data_type);
CREATE INDEX idx_behavioral_data_timestamp ON behavioral_data(timestamp);
CREATE INDEX idx_question_responses_session_id ON question_responses(session_id);
CREATE INDEX idx_question_responses_question_id ON question_responses(question_id);
CREATE INDEX idx_question_responses_question_type ON question_responses(question_type);
CREATE INDEX idx_contradictions_session_id ON contradictions(session_id);
CREATE INDEX idx_contradictions_severity ON contradictions(severity);
CREATE INDEX idx_contradictions_type ON contradictions(contradiction_type);
CREATE INDEX idx_assessment_scores_session_id ON assessment_scores(session_id);
CREATE INDEX idx_assessment_scores_score_type ON assessment_scores(score_type);
CREATE INDEX idx_assessment_scores_score_value ON assessment_scores(score_value);
CREATE INDEX idx_candidate_profiles_session_id ON candidate_profiles(session_id);
CREATE INDEX idx_candidate_profiles_profile_id ON candidate_profiles(profile_id);
CREATE INDEX idx_candidate_profiles_overall_score ON candidate_profiles(overall_score);
CREATE INDEX idx_candidate_profiles_recommendation ON candidate_profiles(recommendation);
CREATE INDEX idx_flow_adaptations_session_id ON flow_adaptations(session_id);
CREATE INDEX idx_flow_adaptations_adaptation_type ON flow_adaptations(adaptation_type);
CREATE INDEX idx_flow_adaptations_severity ON flow_adaptations(severity);
CREATE INDEX idx_analytics_summary_date ON analytics_summary(date);
CREATE INDEX idx_recruiter_notifications_session_id ON recruiter_notifications(session_id);
CREATE INDEX idx_recruiter_notifications_notification_type ON recruiter_notifications(notification_type);
CREATE INDEX idx_recruiter_notifications_priority ON recruiter_notifications(priority);
CREATE INDEX idx_recruiter_notifications_sent_at ON recruiter_notifications(sent_at);
CREATE INDEX idx_assessment_questions_question_id ON assessment_questions(question_id);
CREATE INDEX idx_assessment_questions_question_type ON assessment_questions(question_type);
CREATE INDEX idx_assessment_questions_category ON assessment_questions(category);
CREATE INDEX idx_assessment_questions_difficulty_level ON assessment_questions(difficulty_level);
CREATE INDEX idx_system_config_config_key ON system_config(config_key);
CREATE INDEX idx_system_config_is_active ON system_config(is_active);

-- Create composite indexes for performance
CREATE INDEX idx_behavioral_data_session_timestamp ON behavioral_data(session_id, timestamp);
CREATE INDEX idx_question_responses_session_timestamp ON question_responses(session_id, created_at);
CREATE INDEX idx_assessment_scores_session_type ON assessment_scores(session_id, score_type);
CREATE INDEX idx_candidate_profiles_recommendation_score ON candidate_profiles(recommendation, overall_score);

-- Create views for common queries
CREATE VIEW assessment_overview AS
SELECT 
    s.session_id,
    s.candidate_name,
    s.candidate_email,
    s.start_time,
    s.end_time,
    s.total_duration,
    s.status,
    cp.overall_score,
    cp.recommendation,
    cp.confidence_level,
    COUNT(c.id) as contradiction_count,
    COUNT(r.id) as questions_answered
FROM assessment_sessions s
LEFT JOIN candidate_profiles cp ON s.session_id = cp.session_id
LEFT JOIN contradictions c ON s.session_id = c.session_id
LEFT JOIN question_responses r ON s.session_id = r.session_id
GROUP BY s.session_id, s.candidate_name, s.candidate_email, s.start_time, s.end_time, s.total_duration, s.status, cp.overall_score, cp.recommendation, cp.confidence_level;

CREATE VIEW behavioral_summary AS
SELECT 
    session_id,
    AVG(CASE WHEN data_type = 'confidence_score' THEN (data_json->>'score')::numeric END) as avg_confidence,
    AVG(CASE WHEN data_type = 'stress_indicator' THEN (data_json->>'level')::numeric END) as avg_stress,
    COUNT(CASE WHEN data_type = 'mouse_movement' THEN 1 END) as mouse_movements,
    COUNT(CASE WHEN data_type = 'click_pattern' THEN 1 END) as clicks,
    COUNT(CASE WHEN data_type = 'typing_pattern' THEN 1 END) as typing_events,
    COUNT(CASE WHEN data_type = 'navigation' THEN 1 END) as navigation_events
FROM behavioral_data
GROUP BY session_id;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_assessment_results(p_session_id VARCHAR(255))
RETURNS TABLE (
    session_id VARCHAR(255),
    candidate_name VARCHAR(255),
    candidate_email VARCHAR(255),
    overall_score DECIMAL(5,2),
    recommendation VARCHAR(20),
    contradiction_count BIGINT,
    questions_answered BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.session_id,
        s.candidate_name,
        s.candidate_email,
        cp.overall_score,
        cp.recommendation,
        COUNT(c.id) as contradiction_count,
        COUNT(r.id) as questions_answered
    FROM assessment_sessions s
    LEFT JOIN candidate_profiles cp ON s.session_id = cp.session_id
    LEFT JOIN contradictions c ON s.session_id = c.session_id
    LEFT JOIN question_responses r ON s.session_id = r.session_id
    WHERE s.session_id = p_session_id
    GROUP BY s.session_id, s.candidate_name, s.candidate_email, cp.overall_score, cp.recommendation;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_analytics_summary(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    assessment_date DATE,
    total_assessments BIGINT,
    completed_assessments BIGINT,
    abandoned_assessments BIGINT,
    average_score DECIMAL(5,2),
    average_completion_time DECIMAL(10,2),
    contradictions_detected BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(s.start_time) as assessment_date,
        COUNT(*) as total_assessments,
        COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as completed_assessments,
        COUNT(CASE WHEN s.status = 'abandoned' THEN 1 END) as abandoned_assessments,
        AVG(cp.overall_score) as average_score,
        AVG(s.total_duration) as average_completion_time,
        COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) as contradictions_detected
    FROM assessment_sessions s
    LEFT JOIN candidate_profiles cp ON s.session_id = cp.session_id
    LEFT JOIN contradictions c ON s.session_id = c.session_id
    WHERE DATE(s.start_time) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(s.start_time)
    ORDER BY assessment_date;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON assessment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_summary_updated_at BEFORE UPDATE ON analytics_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO assessment_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO assessment_user;
