import rateLimit from 'express-rate-limit';
import logSecurityEvent from '../services/securityLogger.js';

// Default rate limit configuration
const defaultLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    // Log rate limit violations
    logSecurityEvent({
      event: 'RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
};

// General API rate limiting
export const generalLimiter = rateLimit({
  ...defaultLimitConfig,
  max: 100,
  message: 'Genel API limiti aşıldı'
});

// Stricter rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logSecurityEvent({
      event: 'AUTH_RATE_LIMIT_EXCEEDED',
      userId: null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        body: req.body ? Object.keys(req.body) : []
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Password reset rate limiting (very strict)
export const passwordResetLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logSecurityEvent({
      event: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      userId: null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        email: req.body?.email || 'unknown',
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        message: 'Şifre sıfırlama limitine ulaşıldı. 1 saat sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 uploads per 10 minutes
  handler: (req, res) => {
    logSecurityEvent({
      event: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: 'Dosya yükleme limitine ulaşıldı. 10 dakika sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Story creation rate limiting
export const storyCreationLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 stories per hour
  handler: (req, res) => {
    logSecurityEvent({
      event: 'STORY_CREATION_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'STORY_CREATION_RATE_LIMIT_EXCEEDED',
        message: 'Hikaye oluşturma limitine ulaşıldı. 1 saat sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Comment creation rate limiting
export const commentLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 comments per 5 minutes
  handler: (req, res) => {
    logSecurityEvent({
      event: 'COMMENT_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'COMMENT_RATE_LIMIT_EXCEEDED',
        message: 'Yorum limitine ulaşıldı. 5 dakika sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Message sending rate limiting
export const messageLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // 15 messages per 10 minutes
  handler: (req, res) => {
    logSecurityEvent({
      event: 'MESSAGE_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
        message: 'Mesaj gönderme limitine ulaşıldı. 10 dakika sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Admin operations rate limiting (more permissive for admins)
export const adminLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // 200 requests per 5 minutes for admin operations
  handler: (req, res) => {
    logSecurityEvent({
      event: 'ADMIN_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        adminOperation: true
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'ADMIN_RATE_LIMIT_EXCEEDED',
        message: 'Admin işlem limitine ulaşıldı. 5 dakika sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Search rate limiting
export const searchLimiter = rateLimit({
  ...defaultLimitConfig,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 search requests per minute
  handler: (req, res) => {
    logSecurityEvent({
      event: 'SEARCH_RATE_LIMIT_EXCEEDED',
      userId: req.user?.id || null,
      ip: req.ip,
      meta: {
        endpoint: req.path,
        method: req.method,
        searchQuery: req.query.q || req.query.search || 'unknown',
        userAgent: req.get('User-Agent')
      }
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'SEARCH_RATE_LIMIT_EXCEEDED',
        message: 'Arama limitine ulaşıldı. 1 dakika sonra tekrar deneyin.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000)
      }
    });
  }
});

// Create a rate limiter based on environment
export const createRateLimiter = (options = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

  if (!isRateLimitEnabled && !isProduction) {
    // Return a no-op middleware for development if rate limiting is disabled
    return (req, res, next) => next();
  }

  return rateLimit({
    ...defaultLimitConfig,
    ...options
  });
};

export default {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  storyCreationLimiter,
  commentLimiter,
  messageLimiter,
  adminLimiter,
  searchLimiter,
  createRateLimiter
};