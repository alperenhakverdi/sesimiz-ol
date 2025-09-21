const fs = require('fs');

/**
 * Application Server Deployment Configuration
 * PM2 cluster mode and production setup
 */

// PM2 Ecosystem Configuration
const pm2Config = {
  apps: [{
    name: 'sesimiz-ol-api',
    script: './backend/src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_NAME: process.env.DB_NAME || 'sesimiz_ol',
      DB_USER: process.env.DB_USER || 'sesimiz_user',
      DB_PASSWORD: process.env.DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.outerr.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

// Deployment Script
const deploymentScript = `#!/bin/bash
# Sesimiz Ol Production Deployment Script

set -e

echo "🚀 Starting Sesimiz Ol deployment..."

# Update system packages
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /opt/sesimiz-ol
sudo chown $USER:$USER /opt/sesimiz-ol

# Copy application files
cp -r . /opt/sesimiz-ol/
cd /opt/sesimiz-ol

# Install dependencies
npm ci --production

# Build frontend
cd frontend && npm ci && npm run build && cd ..

# Create logs directory
mkdir -p logs

# Set up environment
cp .env.example .env
echo "⚠️  Please configure .env file with production values"

# Start application with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

echo "✅ Deployment completed successfully"
echo "🔗 Application running on: http://localhost:3001"
`;

// Generate all deployment files
function generateDeploymentFiles() {
  console.log('📦 Generating deployment configurations...');

  // Write PM2 config
  fs.writeFileSync('ecosystem.config.js',
    `module.exports = ${JSON.stringify(pm2Config, null, 2)}`);
  console.log('✅ ecosystem.config.js generated');

  // Write deployment script
  fs.writeFileSync('deploy.sh', deploymentScript, { mode: 0o755 });
  console.log('✅ deploy.sh generated');

  console.log('🎯 Application server deployment ready');
}

if (require.main === module) {
  generateDeploymentFiles();
}

module.exports = { generateDeploymentFiles, pm2Config };