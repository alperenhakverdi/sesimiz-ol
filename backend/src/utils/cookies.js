import { parseDurationToMs } from './time.js';

const defaultAccessTtlMs = 15 * 60 * 1000;
const defaultRefreshTtlMs = 7 * 24 * 60 * 60 * 1000;

const ACCESS_COOKIE = process.env.AUTH_COOKIE_NAME || 'sesimizol.access';
const REFRESH_COOKIE = process.env.AUTH_REFRESH_COOKIE_NAME || 'sesimizol.refresh';
const CSRF_COOKIE = process.env.CSRF_COOKIE_NAME || 'sesimizol.csrf';

const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
const baseOptions = {
  httpOnly: true,
  secure: process.env.AUTH_COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  sameSite: ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : 'lax',
  path: process.env.AUTH_COOKIE_PATH || '/',
  domain: process.env.AUTH_COOKIE_DOMAIN || undefined
};

if (baseOptions.sameSite === 'none') {
  baseOptions.secure = true;
}

// In non-production environments, relax cookie settings for localhost development
// to avoid logout on refresh due to Secure/None requirements without HTTPS.
if ((process.env.NODE_ENV || 'development').toLowerCase() !== 'production') {
  baseOptions.secure = false;
  baseOptions.sameSite = 'lax';
}

export const buildCookieOptions = (overrides = {}) => ({
  ...baseOptions,
  ...overrides
});

const accessMaxAge = parseDurationToMs(process.env.JWT_ACCESS_EXPIRES_IN || '15m', defaultAccessTtlMs);
const refreshMaxAge = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d', defaultRefreshTtlMs);

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE, accessToken, buildCookieOptions({
    maxAge: accessMaxAge
  }));

  res.cookie(REFRESH_COOKIE, refreshToken, buildCookieOptions({
    maxAge: refreshMaxAge
  }));
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, buildCookieOptions({ maxAge: 0 }));
  res.clearCookie(REFRESH_COOKIE, buildCookieOptions({ maxAge: 0 }));
  res.clearCookie(CSRF_COOKIE, buildCookieOptions({ httpOnly: false, maxAge: 0 }));
};

export const getCookieNames = () => ({
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
  csrf: CSRF_COOKIE
});
