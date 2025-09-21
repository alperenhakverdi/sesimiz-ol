# Sesimiz Ol Security Hardening Guide

**Version:** 1.0
**Date:** 2025-09-21
**Target:** Production Deployment Security

## Overview

This guide provides comprehensive security hardening procedures for the Sesimiz Ol digital storytelling platform. It addresses the vulnerabilities identified in the security assessment and provides step-by-step implementation guidance.

## Critical Security Fixes (Immediate Priority)

### 1. JWT Secret Security

**Issue:** Default JWT secrets in configuration
**Risk Level:** CRITICAL
**Impact:** Complete authentication bypass possible

#### Implementation:

```javascript
// backend/src/services/authTokens.js
const validateSecretStrength = (secret, name) => {
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be at least 32 characters long`);
  }

  const defaultSecrets = [
    'change-this-access-secret-at-least-32-chars',
    'change-this-refresh-secret-at-least-32-chars',
    'change-this-reset-secret-at-least-32-chars'
  ];

  if (defaultSecrets.includes(secret)) {
    throw new Error(`Default ${name} detected - must be changed for production`);
  }

  // Check for sufficient entropy
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < 16) {
    throw new Error(`${name} lacks sufficient entropy`);
  }
};

const ACCESS_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  validateSecretStrength(secret, 'JWT_SECRET');
  return secret;
})();

const REFRESH_SECRET = (() => {
  const secret = process.env.JWT_REFRESH_SECRET;
  validateSecretStrength(secret, 'JWT_REFRESH_SECRET');
  return secret;
})();
```

### 2. Content Sanitization (XSS Prevention)

**Issue:** User content not sanitized for HTML output
**Risk Level:** CRITICAL
**Impact:** Cross-site scripting attacks

#### Installation:
```bash
npm install dompurify isomorphic-dompurify
```

#### Implementation:

```javascript
// backend/src/utils/sanitization.js
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false
  };

  return DOMPurify.sanitize(dirty, { ...defaultOptions, ...options });
};

export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Remove potentially dangerous characters
  return text
    .replace(/[<>'"&]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char];
    })
    .replace(/\x00/g, '') // Remove null bytes
    .trim();
};

// Apply to story controller
export const sanitizeStoryContent = (story) => ({
  ...story,
  title: sanitizeText(story.title),
  content: sanitizeHtml(story.content),
  bio: story.bio ? sanitizeText(story.bio) : null
});
```

### 3. File Upload Security Enhancement

**Issue:** Insufficient file validation
**Risk Level:** HIGH
**Impact:** Malicious file uploads

#### Implementation:

```javascript
// backend/src/middleware/upload.js (enhanced)
import fileType from 'file-type';
import { createHash } from 'crypto';

// Magic number validation
const validateFileContent = async (buffer) => {
  const type = await fileType.fromBuffer(buffer);

  const allowedTypes = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp']
  };

  if (!type || !allowedTypes[type.mime]) {
    throw new Error('Invalid file type detected');
  }

  return type;
};

// Enhanced image filter
const enhancedImageFilter = async (req, file, cb) => {
  try {
    // Basic MIME type check
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
    }

    // File extension validation
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
    if (!allowedExtensions.test(file.originalname)) {
      return cb(new Error('Invalid file extension'), false);
    }

    // Check for double extensions
    const extensionCount = (file.originalname.match(/\./g) || []).length;
    if (extensionCount > 1) {
      return cb(new Error('Multiple file extensions not allowed'), false);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Enhanced processing with content validation
export const processAvatar = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Validate file content
    const fileTypeResult = await validateFileContent(req.file.buffer);

    // Generate secure filename
    const hash = createHash('sha256')
      .update(req.file.buffer)
      .digest('hex')
      .substring(0, 16);

    const userId = req.user?.id || 'temp';
    const timestamp = Date.now();
    const extension = fileTypeResult.ext;
    const filename = `avatar_${userId}_${timestamp}_${hash}.webp`;

    // Process with additional security
    const processedBuffer = await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Final size check
    if (processedBuffer.length > 1024 * 1024) { // 1MB limit for processed file
      throw new Error('Processed file too large');
    }

    const filepath = path.join(avatarDir, filename);
    await fs.writeFile(filepath, processedBuffer);

    req.processedFile = {
      filename,
      path: filepath,
      url: `/uploads/avatars/${filename}`,
      originalname: file.originalname,
      mimetype: 'image/webp',
      size: processedBuffer.length,
      hash
    };

    next();
  } catch (error) {
    console.error('Enhanced avatar processing error:', error);
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_PROCESSING_FAILED',
        message: 'File processing failed security validation'
      }
    });
  }
};
```

## High Priority Security Enhancements

### 4. Enhanced Authorization Checks

**Issue:** Missing resource-level authorization
**Risk Level:** HIGH

#### Implementation:

```javascript
// backend/src/middleware/authorization.js (enhanced)
export const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = parseInt(req.params.id);
      const userId = req.user.id;

      let resource;

      switch (resourceType) {
        case 'story':
          resource = await prisma.story.findUnique({
            where: { id: resourceId },
            select: { authorId: true }
          });
          break;
        case 'comment':
          resource = await prisma.comment.findUnique({
            where: { id: resourceId },
            select: { authorId: true }
          });
          break;
        default:
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_RESOURCE_TYPE', message: 'Invalid resource type' }
          });
      }

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Resource not found' }
        });
      }

      if (resource.authorId !== userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to access this resource' }
        });
      }

      next();
    } catch (error) {
      console.error('Authorization check error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'AUTHORIZATION_ERROR', message: 'Authorization check failed' }
      });
    }
  };
};

// Apply to routes
router.put('/:id', authenticateToken, csrfMiddleware, requireOwnership('story'), updateStory);
router.delete('/:id', authenticateToken, csrfMiddleware, requireOwnership('story'), deleteStory);
```

### 5. Data Minimization

**Issue:** Sensitive data exposure
**Risk Level:** HIGH

#### Implementation:

```javascript
// backend/src/utils/userProfile.js (enhanced)
export const publicUserSelect = {
  id: true,
  nickname: true,
  avatar: true,
  bio: true,
  createdAt: true,
  // Explicitly exclude sensitive fields
  email: false,
  password: false,
  lastLoginAt: false,
  failedLoginCount: false,
  lastFailedLoginAt: false,
  lockedUntil: false
};

export const authUserSelect = {
  ...publicUserSelect,
  email: true,
  role: true,
  isActive: true,
  isBanned: true,
  emailVerified: true
  // Still exclude password and security fields
};

export const mapUserForClient = (user, includePrivate = false) => {
  const baseUser = {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt
  };

  if (includePrivate) {
    return {
      ...baseUser,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    };
  }

  return baseUser;
};
```

## Medium Priority Security Enhancements

### 6. Enhanced Rate Limiting

**Issue:** Rate limiting can be bypassed
**Risk Level:** MEDIUM

#### Implementation:

```javascript
// backend/src/config/rateLimit.js (enhanced)
const MINIMUM_RATE_LIMITS = {
  general: { windowMs: 15 * 60 * 1000, max: 1000 },
  auth: { windowMs: 15 * 60 * 1000, max: 10 },
  upload: { windowMs: 15 * 60 * 1000, max: 20 }
};

const buildLimiter = ({ name, windowMs, max, code, message, skipFailedRequests = false, skipSuccessfulRequests = false }) => {
  // Always enforce minimum rate limits
  const minLimits = MINIMUM_RATE_LIMITS[name] || MINIMUM_RATE_LIMITS.general;
  const effectiveWindowMs = Math.min(windowMs, minLimits.windowMs);
  const effectiveMax = Math.min(max, minLimits.max);

  return rateLimit({
    windowMs: effectiveWindowMs,
    max: effectiveMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use both IP and user ID if available for more precise limiting
      const ip = req.ip || req.connection.remoteAddress;
      const userId = req.user?.id;
      return userId ? `${ip}:${userId}` : ip;
    },
    handler: (req, res) => {
      const retryAfterSeconds = Math.ceil(effectiveWindowMs / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      // Log rate limit violations
      console.warn(`[rate-limit:${name}] IP: ${req.ip}, Path: ${req.originalUrl}`);

      res.status(429).json({
        success: false,
        error: {
          code,
          message,
          retryAfter: retryAfterSeconds
        }
      });
    }
  });
};
```

### 7. Database Security Enhancement

**Issue:** Database connections not encrypted
**Risk Level:** MEDIUM

#### Implementation:

```javascript
// backend/prisma/schema.prisma (enhanced)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_DIRECT_URL")
}

// .env configuration for SSL
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require&sslcert=client-cert.pem&sslkey=client-key.pem&sslrootcert=ca-cert.pem"
```

### 8. Session Security Enhancement

**Issue:** Session fingerprinting missing
**Risk Level:** MEDIUM

#### Implementation:

```javascript
// backend/src/services/sessionService.js (enhanced)
import crypto from 'crypto';

const generateFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip || ''
  ];

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
};

export const createSessionWithTokens = async ({ user, userAgent, ipAddress, req }) => {
  const fingerprint = generateFingerprint(req);

  // Check for suspicious activity (same user, different fingerprint)
  const recentSessions = await prisma.userSession.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    }
  });

  const suspiciousActivity = recentSessions.some(session =>
    session.fingerprint && session.fingerprint !== fingerprint
  );

  if (suspiciousActivity) {
    logSecurityEvent({
      event: 'SUSPICIOUS_LOGIN_FINGERPRINT',
      userId: user.id,
      ip: ipAddress,
      meta: { fingerprint, previousFingerprints: recentSessions.map(s => s.fingerprint) }
    });
  }

  // Continue with session creation including fingerprint
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashedRefreshToken,
      userAgent,
      ipAddress,
      fingerprint,
      expiresAt: new Date(Date.now() + absoluteTtlMs),
      geolocation: await getGeolocation(ipAddress)
    }
  });

  // Rest of implementation...
};
```

## Security Configuration Hardening

### 9. Environment Variable Validation

**Issue:** Production secrets not validated
**Risk Level:** HIGH

#### Implementation:

```javascript
// backend/src/config/validation.js
export const validateEnvironment = () => {
  const requiredSecrets = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CSRF_SECRET',
    'DATABASE_URL'
  ];

  const missingSecrets = [];
  const weakSecrets = [];

  for (const secret of requiredSecrets) {
    const value = process.env[secret];

    if (!value) {
      missingSecrets.push(secret);
    } else if (value.length < 32) {
      weakSecrets.push(secret);
    } else if (value.includes('change-me') || value.includes('default')) {
      weakSecrets.push(`${secret} (appears to be default value)`);
    }
  }

  if (missingSecrets.length > 0) {
    throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
  }

  if (weakSecrets.length > 0) {
    throw new Error(`Weak or default secrets detected: ${weakSecrets.join(', ')}`);
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'test', 'production'];
  if (!validEnvironments.includes(process.env.NODE_ENV)) {
    console.warn(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Defaulting to production.`);
    process.env.NODE_ENV = 'production';
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SECURITY_HEADERS_ENABLED === 'false') {
      throw new Error('Security headers cannot be disabled in production');
    }

    if (!process.env.DATABASE_URL.includes('sslmode=require')) {
      console.warn('Database SSL not explicitly required in production');
    }
  }
};

// Call at application startup
// backend/src/app.js
import { validateEnvironment } from './config/validation.js';

validateEnvironment();
```

### 10. Security Headers Enhancement

**Issue:** Security headers can be disabled
**Risk Level:** HIGH

#### Implementation:

```javascript
// backend/src/app.js (enhanced security headers)
const buildSecurityHeaders = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Never allow disabling security headers in production
  const headersEnabled = isProduction ? true : (process.env.SECURITY_HEADERS_ENABLED !== 'false');

  if (!headersEnabled) {
    console.warn('⚠️ Security headers disabled in non-production environment');
    return (req, res, next) => next();
  }

  const cspDirectives = buildCspDirectives();

  return helmet({
    contentSecurityPolicy: {
      directives: {
        ...cspDirectives,
        // Add security enhancements
        'upgrade-insecure-requests': isProduction ? [] : null,
        'block-all-mixed-content': isProduction ? [] : null
      },
      reportOnly: process.env.SECURITY_HEADERS_REPORT_ONLY === 'true' && !isProduction
    },
    crossOriginResourcePolicy: {
      policy: isProduction ? 'same-site' : 'cross-origin'
    },
    crossOriginOpenerPolicy: {
      policy: 'same-origin-allow-popups'
    },
    crossOriginEmbedderPolicy: false,
    dnsPrefetchControl: {
      allow: !isProduction
    },
    frameguard: {
      action: 'deny'
    },
    hidePoweredBy: true,
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    } : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },
    referrerPolicy: {
      policy: ['no-referrer', 'strict-origin-when-cross-origin']
    },
    // Additional security headers
    expectCt: isProduction ? {
      maxAge: 86400,
      enforce: true
    } : false
  });
};

app.use(buildSecurityHeaders());
```

## Production Deployment Security Checklist

### Pre-Deployment Security Verification

- [ ] **Secrets Management**
  - [ ] All default secrets changed
  - [ ] Strong secrets generated (32+ characters)
  - [ ] Secrets stored securely (not in code)
  - [ ] Environment validation passes

- [ ] **Database Security**
  - [ ] SSL/TLS enabled for database connections
  - [ ] Database credentials secured
  - [ ] Database firewall configured
  - [ ] Regular backups encrypted

- [ ] **Application Security**
  - [ ] Security headers enabled and tested
  - [ ] CORS properly configured
  - [ ] Rate limiting enforced
  - [ ] Input validation comprehensive
  - [ ] Content sanitization implemented

- [ ] **File Upload Security**
  - [ ] File type validation enhanced
  - [ ] File size limits enforced
  - [ ] Upload directory secured
  - [ ] File execution prevented

- [ ] **Authentication Security**
  - [ ] JWT secrets secure
  - [ ] Session management hardened
  - [ ] Brute force protection active
  - [ ] Password policies enforced

### Infrastructure Security

- [ ] **Server Hardening**
  - [ ] Operating system updated
  - [ ] Unnecessary services disabled
  - [ ] Firewall configured
  - [ ] SSH keys only (no passwords)

- [ ] **Network Security**
  - [ ] HTTPS enforced
  - [ ] TLS 1.2+ only
  - [ ] Certificate valid
  - [ ] CDN security headers

- [ ] **Monitoring & Logging**
  - [ ] Security event logging enabled
  - [ ] Log aggregation configured
  - [ ] Alerting for security events
  - [ ] Regular log review process

## Incident Response Procedures

### Security Incident Response Plan

1. **Detection & Assessment**
   - Monitor security logs for anomalies
   - Assess severity and scope
   - Document initial findings

2. **Containment**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IP addresses

3. **Eradication**
   - Remove malicious files/code
   - Patch vulnerabilities
   - Update security measures

4. **Recovery**
   - Restore from clean backups
   - Verify system integrity
   - Monitor for recurrence

5. **Lessons Learned**
   - Document incident details
   - Update security procedures
   - Implement additional controls

### Emergency Contacts

- **Security Team Lead:** [Contact Information]
- **System Administrator:** [Contact Information]
- **Database Administrator:** [Contact Information]
- **Legal/Compliance:** [Contact Information]

## Regular Security Maintenance

### Weekly Tasks
- [ ] Review security logs
- [ ] Check for failed login attempts
- [ ] Monitor rate limiting effectiveness
- [ ] Verify backup integrity

### Monthly Tasks
- [ ] Run security test suite
- [ ] Update dependencies
- [ ] Review user permissions
- [ ] Rotate non-critical secrets

### Quarterly Tasks
- [ ] Full security assessment
- [ ] Penetration testing
- [ ] Security training for team
- [ ] Update incident response procedures

## Compliance Requirements

### Data Protection Compliance
- [ ] GDPR compliance (if applicable)
- [ ] KVKK compliance (Turkey)
- [ ] Data minimization implemented
- [ ] User consent mechanisms

### Security Standards Compliance
- [ ] OWASP Top 10 addressed
- [ ] ISO 27001 considerations
- [ ] Industry-specific requirements
- [ ] Regular compliance audits

This security hardening guide should be implemented progressively, starting with critical issues and moving through high and medium priority items. Each implementation should be tested thoroughly before deployment to production.