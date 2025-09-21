const fs = require('fs');

/**
 * Security Hardening Configuration
 * Production security measures and configurations
 */

// Security headers middleware
const securityHeaders = `
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware configuration
const securityMiddleware = (app) => {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use('/api/', limiter);

  // Strict rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts'
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
};

module.exports = securityMiddleware;
`;

// SSL/TLS Configuration
const sslConfig = `
# SSL/TLS Configuration for Nginx

server {
    listen 80;
    server_name sesimiz-ol.com www.sesimiz-ol.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sesimiz-ol.com www.sesimiz-ol.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/sesimiz-ol.crt;
    ssl_certificate_key /etc/ssl/private/sesimiz-ol.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Application proxy
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

// Security setup script
const securitySetupScript = `#!/bin/bash
# Security Hardening Setup Script

set -e

echo "🔒 Starting security hardening..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban -y

# Configure fail2ban
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

# Install and configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Secure shared memory
echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" | sudo tee -a /etc/fstab

# Disable unnecessary services
sudo systemctl disable cups
sudo systemctl disable avahi-daemon

echo "✅ Security hardening completed"
`;

function generateSecurityFiles() {
  console.log('🔒 Generating security configurations...');

  // Create security directory
  if (!fs.existsSync('scripts/security')) {
    fs.mkdirSync('scripts/security', { recursive: true });
  }

  // Write security headers
  fs.writeFileSync('scripts/security/security-headers.js', securityHeaders);
  console.log('✅ security-headers.js generated');

  // Write SSL config
  fs.writeFileSync('scripts/security/nginx-ssl.conf', sslConfig);
  console.log('✅ nginx-ssl.conf generated');

  // Write security setup script
  fs.writeFileSync('scripts/security/security-setup.sh', securitySetupScript, { mode: 0o755 });
  console.log('✅ security-setup.sh generated');

  console.log('🎯 Security hardening configurations ready');
}

if (require.main === module) {
  generateSecurityFiles();
}

module.exports = { generateSecurityFiles };