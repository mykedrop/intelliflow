-- PostgreSQL schema for candidates

CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    linkedin VARCHAR(255),
    score INTEGER NOT NULL,
    tier VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    assigned_recruiter VARCHAR(100),
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_responses (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id),
    responses JSONB NOT NULL,
    behavior_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recruiter_actions (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id),
    recruiter_name VARCHAR(100),
    action VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_tier ON candidates(tier);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_submitted ON candidates(submitted_at DESC);
