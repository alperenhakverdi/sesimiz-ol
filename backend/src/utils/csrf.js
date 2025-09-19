import crypto from 'crypto';
import { buildCookieOptions, getCookieNames } from './cookies.js';

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-me';
const CSRF_HEADER_NAME = (process.env.CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const { csrf: CSRF_COOKIE_NAME } = getCookieNames();

const createSignature = (raw) =>
  crypto.createHmac('sha256', CSRF_SECRET).update(raw).digest('hex');

export const generateCsrfToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const signature = createSignature(raw);
  return `${raw}.${signature}`;
};

const isTokenValid = (token) => {
  if (!token) return false;
  const [raw, signature] = token.split('.');
  if (!raw || !signature) return false;
  const expected = createSignature(raw);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};

export const setCsrfCookie = (res, token) => {
  res.cookie(
    CSRF_COOKIE_NAME,
    token,
    buildCookieOptions({
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000
    })
  );
};

export const clearCsrfCookie = (res) => {
  res.clearCookie(
    CSRF_COOKIE_NAME,
    buildCookieOptions({ httpOnly: false, maxAge: 0 })
  );
};

export const verifyCsrf = (req) => {
  const headerToken = req.headers[CSRF_HEADER_NAME];
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  if (!headerToken || !cookieToken) {
    return false;
  }

  if (headerToken !== cookieToken) {
    return false;
  }

  return isTokenValid(headerToken);
};

export const csrfMiddleware = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  if (!verifyCsrf(req)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'CSRF doğrulaması başarısız'
      }
    });
  }

  return next();
};

export const CSRF_HEADER = CSRF_HEADER_NAME;
