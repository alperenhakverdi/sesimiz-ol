import rateLimit from 'express-rate-limit';

const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const defaultWindowMs = 15 * 60 * 1000;

const generalWindowMs = parsePositiveInt(process.env.RATE_LIMIT_GENERAL_WINDOW_MS, defaultWindowMs);
const generalMax = parsePositiveInt(process.env.RATE_LIMIT_GENERAL_MAX, 100);

const authWindowMs = parsePositiveInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS, process.env.NODE_ENV === 'development' ? 60 * 1000 : generalWindowMs);
const authMax = parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, process.env.NODE_ENV === 'development' ? 50 : 5);

const uploadWindowMs = parsePositiveInt(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS, generalWindowMs);
const uploadMax = parsePositiveInt(process.env.RATE_LIMIT_UPLOAD_MAX, 10);

const buildLimiter = ({ name, windowMs, max, code, message, skipFailedRequests = false, skipSuccessfulRequests = false }) => {
  if (!RATE_LIMIT_ENABLED) {
    return (req, res, next) => next();
  }

  const limiterWindowMs = windowMs;
  const limiterMax = max;

  return rateLimit({
    windowMs: limiterWindowMs,
    max: limiterMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests,
    skipSuccessfulRequests,
    handler: (req, res) => {
      const retryAfterSeconds = Math.ceil(limiterWindowMs / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);

      if ((process.env.LOG_LEVEL || '').toLowerCase() === 'debug') {
        console.warn(`[rate-limit:${name}]`, {
          ip: req.ip,
          path: req.originalUrl
        });
      }

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

const noopLimiter = (req, res, next) => next();

export const generalRateLimiter = RATE_LIMIT_ENABLED
  ? buildLimiter({
      name: 'general',
      windowMs: generalWindowMs,
      max: generalMax,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.'
    })
  : noopLimiter;

export const authRateLimiter = RATE_LIMIT_ENABLED
  ? buildLimiter({
      name: 'auth',
      windowMs: authWindowMs,
      max: authMax,
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.'
    })
  : noopLimiter;

export const uploadRateLimiter = RATE_LIMIT_ENABLED
  ? buildLimiter({
      name: 'upload',
      windowMs: uploadWindowMs,
      max: uploadMax,
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Çok fazla dosya yükleme denemesi. Lütfen daha sonra tekrar deneyin.'
    })
  : noopLimiter;

export const isRateLimitingEnabled = RATE_LIMIT_ENABLED;
