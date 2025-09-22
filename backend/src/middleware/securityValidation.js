import crypto from 'crypto';

/**
 * Security Configuration Validation Middleware
 *
 * This middleware validates critical security configurations on startup
 * to ensure the application is properly secured in production.
 */

// Minimum security requirements
const SECURITY_REQUIREMENTS = {
  JWT_SECRET: {
    minLength: 32,
    entropyBits: 128
  },
  SESSION_SECRET: {
    minLength: 32,
    entropyBits: 128
  },
  ADMIN_PANEL_SECRET: {
    minLength: 16,
    entropyBits: 64
  }
};

// Common weak secrets to check against
const WEAK_SECRETS = [
  'secret',
  'password',
  'admin',
  'test',
  'development',
  'your-secret-here',
  'change-me',
  'default',
  'sesimiz-ol',
  'supersecret',
  '123456',
  'qwerty',
  'your-super-secure-jwt-secret-here-change-this',
  'your-session-secret-here',
  'your-admin-panel-secret'
];

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

/**
 * Calculate entropy of a string
 */
function calculateEntropy(str) {
  const freq = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;
  for (const count of Object.values(freq)) {
    const p = count / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return entropy * len;
}

/**
 * Check if a secret is weak
 */
function isWeakSecret(secret) {
  if (!secret || typeof secret !== 'string') {
    return true;
  }

  const lowerSecret = secret.toLowerCase();

  // Check against common weak secrets
  if (WEAK_SECRETS.some(weak => lowerSecret.includes(weak.toLowerCase()))) {
    return true;
  }

  // Check for patterns like repeated characters
  if (/(.)\1{3,}/.test(secret)) {
    return true;
  }

  // Check for sequential patterns
  if (/(123|abc|qwe)/i.test(secret)) {
    return true;
  }

  return false;
}

/**
 * Validate a single secret
 */
function validateSecret(name, secret, requirements) {
  const errors = [];
  const warnings = [];

  if (!secret) {
    errors.push(`${name} is not set`);
    return { valid: false, errors, warnings };
  }

  if (typeof secret !== 'string') {
    errors.push(`${name} must be a string`);
    return { valid: false, errors, warnings };
  }

  // Length check
  if (secret.length < requirements.minLength) {
    errors.push(`${name} must be at least ${requirements.minLength} characters long (current: ${secret.length})`);
  }

  // Entropy check
  const entropy = calculateEntropy(secret);
  if (entropy < requirements.entropyBits) {
    warnings.push(`${name} has low entropy (${Math.round(entropy)} bits, recommended: ${requirements.entropyBits}+)`);
  }

  // Weak secret check
  if (isWeakSecret(secret)) {
    errors.push(`${name} appears to be a weak or default secret`);
  }

  // Check if it's hex-encoded (common for crypto secrets)
  const isHex = /^[0-9a-f]+$/i.test(secret);
  if (isHex && secret.length >= 32) {
    // Good, likely a proper random hex string
  } else if (secret.length >= requirements.minLength && entropy >= requirements.entropyBits) {
    // Good entropy and length, probably okay
  } else {
    warnings.push(`${name} should be a cryptographically random string`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate all security configurations
 */
export function validateSecurityConfig() {
  const results = {
    valid: true,
    errors: [],
    warnings: []
  };

  log(`${colors.bold}${colors.blue}🔒 Validating Security Configuration${colors.reset}\n`);

  // Validate secrets
  for (const [secretName, requirements] of Object.entries(SECURITY_REQUIREMENTS)) {
    const secretValue = process.env[secretName];
    const validation = validateSecret(secretName, secretValue, requirements);

    if (!validation.valid) {
      results.valid = false;
      results.errors.push(...validation.errors);
    }

    results.warnings.push(...validation.warnings);

    // Log results
    if (validation.valid && validation.warnings.length === 0) {
      log(`✅ ${secretName}: Valid`, 'green');
    } else if (validation.valid) {
      log(`⚠️  ${secretName}: Valid but has warnings`, 'yellow');
      validation.warnings.forEach(warning => log(`   - ${warning}`, 'yellow'));
    } else {
      log(`❌ ${secretName}: Invalid`, 'red');
      validation.errors.forEach(error => log(`   - ${error}`, 'red'));
    }
  }

  // Validate other security settings
  log('\n📋 Other Security Settings:', 'blue');

  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    log('✅ NODE_ENV: production', 'green');
  } else {
    log(`⚠️  NODE_ENV: ${process.env.NODE_ENV || 'not set'} (not production)`, 'yellow');
    results.warnings.push('Application not running in production mode');
  }

  // Check HTTPS settings
  if (process.env.SECURITY_HEADERS_ENABLED !== 'false') {
    log('✅ Security headers: enabled', 'green');
  } else {
    log('❌ Security headers: disabled', 'red');
    results.errors.push('Security headers are disabled');
    results.valid = false;
  }

  // Check rate limiting
  if (process.env.RATE_LIMIT_ENABLED !== 'false') {
    log('✅ Rate limiting: enabled', 'green');
  } else {
    log('⚠️  Rate limiting: disabled', 'yellow');
    results.warnings.push('Rate limiting is disabled');
  }

  // Check CORS configuration
  if (process.env.CORS_ALLOWED_ORIGINS) {
    const origins = process.env.CORS_ALLOWED_ORIGINS.split(',');
    const hasLocalhost = origins.some(origin => origin.includes('localhost') || origin.includes('127.0.0.1'));

    if (process.env.NODE_ENV === 'production' && hasLocalhost) {
      log('⚠️  CORS: localhost allowed in production', 'yellow');
      results.warnings.push('CORS allows localhost origins in production');
    } else {
      log('✅ CORS: properly configured', 'green');
    }
  } else {
    log('⚠️  CORS: using default origins', 'yellow');
    results.warnings.push('CORS_ALLOWED_ORIGINS not explicitly set');
  }

  // Summary
  log('\n' + '='.repeat(50));
  if (results.valid) {
    log(`${colors.bold}${colors.green}✅ Security validation passed!${colors.reset}`);
    if (results.warnings.length > 0) {
      log(`${colors.yellow}⚠️  ${results.warnings.length} warning(s) found${colors.reset}`);
    }
  } else {
    log(`${colors.bold}${colors.red}❌ Security validation failed!${colors.reset}`);
    log(`${colors.red}${results.errors.length} error(s) found${colors.reset}`);
    if (results.warnings.length > 0) {
      log(`${colors.yellow}${results.warnings.length} warning(s) found${colors.reset}`);
    }
  }

  return results;
}

/**
 * Express middleware to validate security on startup
 */
export function securityValidationMiddleware(req, res, next) {
  // This middleware only runs once on first request
  if (securityValidationMiddleware.hasRun) {
    return next();
  }

  const validation = validateSecurityConfig();
  securityValidationMiddleware.hasRun = true;

  if (!validation.valid && process.env.NODE_ENV === 'production') {
    // In production, fail fast on security issues
    const error = new Error('Security validation failed. Check configuration.');
    error.securityErrors = validation.errors;
    throw error;
  }

  next();
}

/**
 * Generate secure secrets for development
 */
export function generateSecureSecrets() {
  log(`${colors.bold}${colors.blue}🔑 Generating Secure Secrets${colors.reset}\n`);

  const secrets = {};

  for (const [secretName, requirements] of Object.entries(SECURITY_REQUIREMENTS)) {
    const bytes = Math.ceil(requirements.entropyBits / 8);
    const secret = crypto.randomBytes(bytes).toString('hex');
    secrets[secretName] = secret;
    log(`${secretName}=${secret}`, 'green');
  }

  log(`\n${colors.yellow}⚠️  Copy these to your .env file and restart the application${colors.reset}`);

  return secrets;
}

export default {
  validateSecurityConfig,
  securityValidationMiddleware,
  generateSecureSecrets
};