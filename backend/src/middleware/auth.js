import { PrismaClient } from '@prisma/client';
import {
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken
} from '../services/authTokens.js';
import { touchSession } from '../services/sessionService.js';
import { getCookieNames } from '../utils/cookies.js';
import { authUserSelect, mapUserForClient } from '../utils/userProfile.js';

const prisma = new PrismaClient();
const { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE } = getCookieNames();

// JWT Token generation utilities
export const generateTokens = (input) => {
  const payload = typeof input === 'number'
    ? { userId: input }
    : input;

  const {
    userId,
    role = 'USER',
    sessionId = undefined,
    isBanned = false,
    emailVerified = false
  } = payload;

  return issueTokenPair({
    userId,
    role,
    sessionId,
    isBanned,
    emailVerified
  });
};

// Verify JWT Token middleware
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token && req.cookies) {
    token = req.cookies[ACCESS_COOKIE];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token required'
      }
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const userRecord = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) },
      select: authUserSelect,
    });

    if (!userRecord || !userRecord.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'User not found or inactive'
        }
      });
    }

    if (userRecord.isBanned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_BANNED',
          message: 'Kullanıcı hesabı engellenmiştir'
        }
      });
    }

    req.user = mapUserForClient(userRecord);
    req.sessionId = decoded.sid || null;

    if (req.sessionId) {
      await touchSession(Number(req.sessionId));
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired'
        }
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        }
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// Refresh token middleware
export const refreshTokenMiddleware = async (req, res, next) => {
  const bodyToken = req.body?.refreshToken;
  const cookieToken = req.cookies ? req.cookies[REFRESH_COOKIE] : undefined;
  const refreshToken = bodyToken || cookieToken;





  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_REFRESH_TOKEN',
        message: 'Refresh token required'
      }
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token'
        }
      });
    }

    req.userId = Number(decoded.sub);
    req.sessionId = decoded.sid || null;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Refresh token expired'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      }
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  if (!token && req.cookies) {
    token = req.cookies[ACCESS_COOKIE];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const userRecord = await prisma.user.findUnique({
      where: { id: Number(decoded.sub) },
      select: authUserSelect,
    });

    req.user =
      userRecord && userRecord.isActive && !userRecord.isBanned
        ? mapUserForClient(userRecord)
        : null;
    req.sessionId = decoded.sid || null;
  } catch (error) {
    req.user = null;
    req.sessionId = null;
  }

  next();
};

export default {
  generateTokens,
  authenticateToken,
  refreshTokenMiddleware,
  optionalAuth,
  signAccessToken
};
