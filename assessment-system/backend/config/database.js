// assessment-system/backend/config/database.js

const { Pool } = require('pg');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER || 'mikeweingarten',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'nm_assessment_system',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', (client) => {
    console.log('✅ Database client connected');
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection function
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        console.log('✅ Database connection successful:', result.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
}

// Initialize database tables
async function initializeDatabase() {
    try {
        console.log('🔄 Initializing database...');
        
        // Test connection first
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }

        // Check if tables exist
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'assessment_sessions'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Database tables already exist');
            return true;
        }

        console.log('📋 Creating database tables...');
        
        // Read and execute schema file
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(__dirname, '../database/schema-postgres.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await pool.query(schema);
        
        console.log('✅ Database tables created successfully');
        return true;
        
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        return false;
    }
}

module.exports = {
    pool,
    testConnection,
    initializeDatabase,
    query: (text, params) => pool.query(text, params)
};
