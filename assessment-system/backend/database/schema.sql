-- assessment-system/backend/database/schema.sql

-- Northwestern Mutual Enhanced Assessment System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS nm_assessment_system;
USE nm_assessment_system;

-- Assessment sessions table
CREATE TABLE assessment_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    assessment_id VARCHAR(100) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('started', 'in_progress', 'completed', 'abandoned') DEFAULT 'started',
    total_duration INT DEFAULT 0, -- in seconds
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_candidate_email (candidate_email),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time)
);

-- Contact information table
CREATE TABLE candidate_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    linkedin_url VARCHAR(500),
    experience_level ENUM('0-1', '1-3', '3-5', '5-10', '10+') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_email (email)
);

-- Behavioral data table
CREATE TABLE behavioral_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    data_type ENUM('mouse_movement', 'click_pattern', 'typing_pattern', 'navigation', 'stress_indicator', 'confidence_score') NOT NULL,
    data_json JSON NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_data_type (data_type),
    INDEX idx_timestamp (timestamp)
);

-- Question responses table
CREATE TABLE question_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    question_id VARCHAR(100) NOT NULL,
    question_type ENUM('scenario', 'timed_response', 'email_simulation', 'drag_drop', 'slider_matrix', 'rapid_fire', 'day_simulation') NOT NULL,
    response_value TEXT,
    response_metadata JSON,
    response_time INT, -- in milliseconds
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_question_id (question_id),
    INDEX idx_question_type (question_type)
);

-- Contradictions table
CREATE TABLE contradictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    contradiction_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL,
    questions_involved JSON NOT NULL, -- Array of question IDs
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_severity (severity),
    INDEX idx_type (contradiction_type)
);

-- Assessment scores table
CREATE TABLE assessment_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    score_type ENUM('overall', 'behavioral', 'response', 'ethical', 'decision_making', 'communication', 'problem_solving', 'teamwork') NOT NULL,
    score_value DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
    score_breakdown JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_score (session_id, score_type),
    INDEX idx_session_id (session_id),
    INDEX idx_score_type (score_type),
    INDEX idx_score_value (score_value)
);

-- Candidate profiles table
CREATE TABLE candidate_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    overall_score DECIMAL(5,2) NOT NULL,
    behavioral_score DECIMAL(5,2),
    response_score DECIMAL(5,2),
    profile_data JSON NOT NULL, -- Complete profile data
    recommendation ENUM('strong_hire', 'hire', 'conditional', 'no_hire') NOT NULL,
    confidence_level ENUM('low', 'medium', 'high') NOT NULL,
    risk_indicators JSON,
    strengths JSON,
    development_areas JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_profile_id (profile_id),
    INDEX idx_overall_score (overall_score),
    INDEX idx_recommendation (recommendation)
);

-- Flow adaptations table
CREATE TABLE flow_adaptations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    adaptation_type VARCHAR(100) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    severity ENUM('low', 'medium', 'high') NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adaptation_data JSON,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_adaptation_type (adaptation_type),
    INDEX idx_severity (severity)
);

-- Analytics summary table
CREATE TABLE analytics_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_assessments INT DEFAULT 0,
    completed_assessments INT DEFAULT 0,
    abandoned_assessments INT DEFAULT 0,
    average_score DECIMAL(5,2),
    average_completion_time INT, -- in seconds
    stress_levels JSON, -- Distribution of stress levels
    confidence_levels JSON, -- Distribution of confidence levels
    ethical_concerns INT DEFAULT 0,
    contradictions_detected INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date),
    INDEX idx_date (date)
);

-- Recruiter notifications table
CREATE TABLE recruiter_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    notification_type ENUM('assessment_completed', 'high_score', 'ethical_concern', 'contradiction_detected') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_priority (priority),
    INDEX idx_sent_at (sent_at)
);

-- Assessment questions metadata table
CREATE TABLE assessment_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id VARCHAR(100) UNIQUE NOT NULL,
    question_type ENUM('scenario', 'timed_response', 'email_simulation', 'drag_drop', 'slider_matrix', 'rapid_fire', 'day_simulation') NOT NULL,
    category VARCHAR(100),
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    question_text TEXT NOT NULL,
    options JSON,
    correct_answer VARCHAR(255),
    scoring_rubric JSON,
    behavior_tracking JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_id (question_id),
    INDEX idx_question_type (question_type),
    INDEX idx_category (category),
    INDEX idx_difficulty_level (difficulty_level)
);

-- System configuration table
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key),
    INDEX idx_is_active (is_active)
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
GROUP BY s.session_id;

CREATE VIEW behavioral_summary AS
SELECT 
    session_id,
    AVG(CASE WHEN data_type = 'confidence_score' THEN JSON_EXTRACT(data_json, '$.score') END) as avg_confidence,
    AVG(CASE WHEN data_type = 'stress_indicator' THEN JSON_EXTRACT(data_json, '$.level') END) as avg_stress,
    COUNT(CASE WHEN data_type = 'mouse_movement' THEN 1 END) as mouse_movements,
    COUNT(CASE WHEN data_type = 'click_pattern' THEN 1 END) as clicks,
    COUNT(CASE WHEN data_type = 'typing_pattern' THEN 1 END) as typing_events,
    COUNT(CASE WHEN data_type = 'navigation' THEN 1 END) as navigation_events
FROM behavioral_data
GROUP BY session_id;

-- Create indexes for performance
CREATE INDEX idx_behavioral_data_session_timestamp ON behavioral_data(session_id, timestamp);
CREATE INDEX idx_question_responses_session_timestamp ON question_responses(session_id, created_at);
CREATE INDEX idx_assessment_scores_session_type ON assessment_scores(session_id, score_type);
CREATE INDEX idx_candidate_profiles_recommendation_score ON candidate_profiles(recommendation, overall_score);

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE GetAssessmentResults(IN p_session_id VARCHAR(255))
BEGIN
    SELECT 
        s.*,
        cp.*,
        c.contradiction_count,
        qr.questions_answered,
        bs.behavioral_summary
    FROM assessment_sessions s
    LEFT JOIN candidate_profiles cp ON s.session_id = cp.session_id
    LEFT JOIN (
        SELECT session_id, COUNT(*) as contradiction_count 
        FROM contradictions 
        WHERE session_id = p_session_id 
        GROUP BY session_id
    ) c ON s.session_id = c.session_id
    LEFT JOIN (
        SELECT session_id, COUNT(*) as questions_answered 
        FROM question_responses 
        WHERE session_id = p_session_id 
        GROUP BY session_id
    ) qr ON s.session_id = qr.session_id
    LEFT JOIN behavioral_summary bs ON s.session_id = bs.session_id
    WHERE s.session_id = p_session_id;
END //

CREATE PROCEDURE GetAnalyticsSummary(IN p_start_date DATE, IN p_end_date DATE)
BEGIN
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
END //

DELIMITER ;

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON nm_assessment_system.* TO 'assessment_user'@'localhost';
-- FLUSH PRIVILEGES;
