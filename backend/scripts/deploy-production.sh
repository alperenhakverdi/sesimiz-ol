#!/bin/bash

# Production Deployment Script for Sesimiz Ol
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "✅ Loaded production environment variables"
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "🗄️  Running database migrations..."
npm run prisma:deploy

# Build the application (if needed)
echo "🔨 Building application..."
npm run build

# Run production tests (optional)
if [ "$RUN_TESTS" = "true" ]; then
    echo "🧪 Running production tests..."
    npm test
fi

# Start the application
echo "🚀 Starting application in production mode..."
exec npm run start:production
