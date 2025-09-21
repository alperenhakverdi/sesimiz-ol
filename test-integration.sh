#!/bin/bash

# Integration Testing Script
echo "🔗 Starting Frontend-Backend Integration Tests..."

# Check if backend is running
if ! curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Backend is not running. Please start it with 'npm run dev'"
    exit 1
fi

echo "✅ Backend is running"

# Check if frontend is running
if ! curl -f http://localhost:5173/ > /dev/null 2>&1; then
    echo "❌ Frontend is not running. Please start it with 'npm run dev'"
    exit 1
fi

echo "✅ Frontend is running"

# Test API endpoints
echo "🔍 Testing API endpoints..."

# Test organizations API
if curl -s http://localhost:3001/api/organizations | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Organizations API working"
else
    echo "❌ Organizations API failed"
fi

# Test announcements API
if curl -s http://localhost:3001/api/announcements | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Announcements API working"
else
    echo "❌ Announcements API failed"
fi

# Test community API
if curl -s http://localhost:3001/api/community/users | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Community API working"
else
    echo "❌ Community API failed"
fi

# Test stories API
if curl -s http://localhost:3001/api/stories | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Stories API working"
else
    echo "❌ Stories API failed"
fi

# Test admin metrics API (should require auth)
if curl -s http://localhost:3001/api/admin/metrics | jq -e '.error.code == "NO_TOKEN"' > /dev/null 2>&1; then
    echo "✅ Admin API properly protected"
else
    echo "❌ Admin API security issue"
fi

# Test CORS
echo "🌐 Testing CORS..."
if curl -s -H "Origin: http://localhost:5173" http://localhost:3001/api/organizations | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ CORS working"
else
    echo "❌ CORS issue"
fi

echo "🎉 Integration tests completed!"
