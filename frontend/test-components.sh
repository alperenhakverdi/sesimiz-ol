#!/bin/bash

# Frontend Component Testing Script
echo "🧪 Starting Frontend Component Tests..."

# Check if frontend is running
if ! curl -f http://localhost:5173/ > /dev/null 2>&1; then
    echo "❌ Frontend is not running. Please start it with 'npm run dev'"
    exit 1
fi

echo "✅ Frontend is running"

# Test critical pages
echo "🔍 Testing critical pages..."

# Test home page
if curl -f http://localhost:5173/ > /dev/null 2>&1; then
    echo "✅ Home page loads"
else
    echo "❌ Home page failed to load"
fi

# Test organizations page
if curl -f http://localhost:5173/stklar > /dev/null 2>&1; then
    echo "✅ Organizations page loads"
else
    echo "❌ Organizations page failed to load"
fi

# Test announcements page
if curl -f http://localhost:5173/duyurular > /dev/null 2>&1; then
    echo "✅ Announcements page loads"
else
    echo "❌ Announcements page failed to load"
fi

# Test community page
if curl -f http://localhost:5173/topluluk > /dev/null 2>&1; then
    echo "✅ Community page loads"
else
    echo "❌ Community page failed to load"
fi

# Test stories page
if curl -f http://localhost:5173/hikayeler > /dev/null 2>&1; then
    echo "✅ Stories page loads"
else
    echo "❌ Stories page failed to load"
fi

echo "🎉 Frontend component tests completed!"
