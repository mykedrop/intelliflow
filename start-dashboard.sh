#!/bin/bash

echo "🚀 Starting Northwestern Mutual Recruiting Intelligence Dashboard"
echo "═══════════════════════════════════════════════════════════════"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the API server
echo "🔌 Starting API server on port 8000..."
node api/server.js &
API_PID=$!

# Wait for API to start
sleep 3

# Check if API is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ API server is running"
else
    echo "❌ API server failed to start"
    kill $API_PID 2>/dev/null
    exit 1
fi

# Populate database with sample data
echo "🗄️  Setting up sample candidate data..."
psql -d postgres -f database/seed-data/create-sample-candidates.sql

echo ""
echo "🎯 Dashboard is ready!"
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Open: http://localhost:8000/health (API Status)"
echo "🎨 Open: frontend/recruiting-dashboard.html (Dashboard)"
echo "🔌 WebSocket: ws://localhost:8001 (Real-time updates)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo ''; echo '🛑 Shutting down...'; kill $API_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
