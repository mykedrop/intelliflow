// assessment-system/backend/simple-server.js

const express = require('express');
const app = express();
const PORT = 8001;

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Simple test route working!' });
});

// API test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API test route working!' });
});

app.listen(PORT, () => {
    console.log(`Simple test server running on port ${PORT}`);
    console.log('Test: http://localhost:8001/test');
    console.log('API Test: http://localhost:8001/api/test');
});
