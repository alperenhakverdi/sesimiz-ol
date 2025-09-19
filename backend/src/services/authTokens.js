import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const ensureSecret = (secret, name) => {
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }
  return secret;
};

export const signAccessToken = ({ userId, role, sessionId, isBanned, emailVerified }) => {
  const payload = {
    sub: String(userId),
    role,
    banned: !!isBanned,
    emailVerified: !!emailVerified
  };

  if (sessionId) {
    payload.sid = String(sessionId);
  }

  return jwt.sign(payload, ensureSecret(ACCESS_SECRET, 'JWT_SECRET'), {
    expiresIn: ACCESS_EXPIRES_IN
  });
};

export const signRefreshToken = ({ userId, sessionId }) => {
  const payload = {
    sub: String(userId)
  };

  if (sessionId) {
    payload.sid = String(sessionId);
  }

  return jwt.sign(payload, ensureSecret(REFRESH_SECRET, 'JWT_REFRESH_SECRET'), {
    expiresIn: REFRESH_EXPIRES_IN
  });
};

export const verifyAccessToken = token =>
  jwt.verify(token, ensureSecret(ACCESS_SECRET, 'JWT_SECRET'));

export const verifyRefreshToken = token =>
  jwt.verify(token, ensureSecret(REFRESH_SECRET, 'JWT_REFRESH_SECRET'));

export const getAccessTokenTTL = () => ACCESS_EXPIRES_IN;
export const getRefreshTokenTTL = () => REFRESH_EXPIRES_IN;

export const issueTokenPair = ({ userId, role, sessionId, isBanned, emailVerified }) => ({
  accessToken: signAccessToken({ userId, role, sessionId, isBanned, emailVerified }),
  refreshToken: signRefreshToken({ userId, sessionId })
});

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenTTL,
  getRefreshTokenTTL,
  issueTokenPair
};
