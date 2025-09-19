import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import logSecurityEvent from './securityLogger.js';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = Number(process.env.PASSWORD_RESET_OTP_SALT_ROUNDS || 12);
const TOKEN_BYTES = Number(process.env.PASSWORD_RESET_TOKEN_BYTES || 32);

const TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 15);
const MAX_ATTEMPTS = Number(process.env.PASSWORD_RESET_MAX_ATTEMPTS || 3);
const RATE_LIMIT_WINDOW_MINUTES = Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES || 60);
const RATE_LIMIT_MAX = Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || 3);

const ttlMs = TOKEN_TTL_MINUTES * 60 * 1000;
const rateLimitWindowMs = RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
const RESET_SESSION_TTL_MINUTES = Number(process.env.PASSWORD_RESET_SESSION_TTL_MINUTES || 10);
const resetSessionTtlMs = RESET_SESSION_TTL_MINUTES * 60 * 1000;
const RESET_SECRET = process.env.PASSWORD_RESET_JWT_SECRET || process.env.JWT_SECRET;

const buildServiceError = (code, message, options = {}) => {
  const error = new Error(message);
  error.name = 'PasswordResetServiceError';
  error.code = code;
  error.status = options.status || 400;
  if (options.retryAfter) {
    error.retryAfter = options.retryAfter;
  }
  if (options.meta) {
    error.meta = options.meta;
  }
  return error;
};

const ensureResetSecret = () => {
  if (!RESET_SECRET) {
    throw new Error('PASSWORD_RESET_JWT_SECRET is not configured');
  }
  return RESET_SECRET;
};

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateOtp = () =>
  String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');

const generateResetToken = () =>
  crypto.randomBytes(TOKEN_BYTES).toString('hex');

const pruneExpiredTokens = async (userId) => {
  const now = new Date();
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      consumedAt: null,
      expiresAt: { lt: now }
    },
    data: {
      consumedAt: now
    }
  });
};

const revokeActiveTokens = async (userId) => {
  const now = new Date();
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      consumedAt: null,
      expiresAt: { gte: now }
    },
    data: {
      consumedAt: now
    }
  });
};

const enforceRateLimit = async (userId) => {
  if (!userId) {
    return;
  }

  const windowStart = new Date(Date.now() - rateLimitWindowMs);

  const recentCount = await prisma.passwordResetToken.count({
    where: {
      userId,
      createdAt: {
        gte: windowStart
      }
    }
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    throw buildServiceError(
      'PASSWORD_RESET_RATE_LIMIT',
      'Çok fazla şifre sıfırlama isteği. Lütfen daha sonra tekrar deneyin.',
      {
        status: 429,
        retryAfter: Math.ceil(rateLimitWindowMs / 1000)
      }
    );
  }
};

export const createPasswordResetRequest = async ({
  userId,
  email,
  ip,
  userAgent
}) => {
  if (!userId) {
    throw buildServiceError('PASSWORD_RESET_USER_REQUIRED', 'Şifre sıfırlama için kullanıcı bulunamadı.');
  }

  await pruneExpiredTokens(userId);
  await enforceRateLimit(userId);
  await revokeActiveTokens(userId);

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
  const token = generateResetToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  const record = await prisma.passwordResetToken.create({
    data: {
      userId,
      otpHash,
      tokenHash,
      expiresAt,
      metadata: {
        email,
        ip,
        userAgent,
        otpHint: `${otp.slice(0, 2)}****`
      }
    }
  });

  logSecurityEvent({
    event: 'PASSWORD_RESET_REQUEST_CREATED',
    userId,
    ip,
    meta: {
      id: record.id,
      expiresAt: expiresAt.toISOString()
    }
  });

  return {
    id: record.id,
    otp,
    token,
    expiresAt,
    maxAttempts: MAX_ATTEMPTS
  };
};

export const getPasswordResetRecordByToken = async ({ token }) => {
  const tokenHash = hashToken(token);
  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  });
};

export const verifyOtpForRecord = async ({ token, otp, ip, userAgent }) => {
  const record = await getPasswordResetRecordByToken({ token });
  if (!record) {
    throw buildServiceError('PASSWORD_RESET_TOKEN_INVALID', 'Geçersiz veya süresi dolmuş şifre sıfırlama isteği.', {
      status: 404
    });
  }

  if (record.consumedAt) {
    throw buildServiceError('PASSWORD_RESET_TOKEN_CONSUMED', 'Bu şifre sıfırlama isteği zaten kullanıldı.', {
      status: 400
    });
  }

  if (record.attemptCount >= MAX_ATTEMPTS) {
    throw buildServiceError('PASSWORD_RESET_MAX_ATTEMPTS', 'En fazla deneme sayısına ulaşıldı.', {
      status: 423
    });
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: {
        attemptCount: {
          increment: 1
        },
        metadata: {
          ...(record.metadata ?? {}),
          lastFailedOtpAt: new Date().toISOString(),
          lastFailedOtpIp: ip || null,
          lastFailedOtpUserAgent: userAgent || null
        }
      }
    });

    throw buildServiceError('PASSWORD_RESET_OTP_INVALID', 'Girilen doğrulama kodu hatalı.', {
      status: 401,
      meta: {
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.attemptCount - 1)
      }
    });
  }

  const now = new Date();
  const updatedRecord = await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: {
      attemptCount: {
        increment: 1
      },
      verifiedAt: now,
      metadata: {
        ...(record.metadata ?? {}),
        lastVerifiedAt: now.toISOString(),
        lastVerifiedIp: ip || null,
        lastVerifiedUserAgent: userAgent || null
      }
    }
  });

  return updatedRecord;
};

export const markResetRequestConsumed = async (id, metadata) => {
  const update = {
    consumedAt: new Date()
  };

  if (typeof metadata !== 'undefined') {
    update.metadata = metadata;
  }

  return prisma.passwordResetToken.update({
    where: { id },
    data: update
  });
};

export const issueResetSessionToken = ({ resetRequestId, userId }) =>
  jwt.sign(
    {
      rid: String(resetRequestId),
      uid: String(userId)
    },
    ensureResetSecret(),
    {
      expiresIn: `${Math.max(1, RESET_SESSION_TTL_MINUTES)}m`
    }
  );

export const verifyResetSessionToken = (token) => {
  try {
    return jwt.verify(token, ensureResetSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw buildServiceError(
        'PASSWORD_RESET_SESSION_EXPIRED',
        'Şifre sıfırlama oturumunun süresi doldu.',
        { status: 401 }
      );
    }

    throw buildServiceError(
      'PASSWORD_RESET_SESSION_INVALID',
      'Şifre sıfırlama oturumu geçersiz.',
      { status: 401 }
    );
  }
};

export const buildPasswordResetServiceError = buildServiceError;
export const getPasswordResetMaxAttempts = () => MAX_ATTEMPTS;
export const getPasswordResetTtlMinutes = () => TOKEN_TTL_MINUTES;
export const getPasswordResetRateLimitWindowSeconds = () => Math.ceil(rateLimitWindowMs / 1000);
export const getResetSessionTtlMinutes = () => RESET_SESSION_TTL_MINUTES;
export const getResetSessionTtlSeconds = () => Math.ceil(resetSessionTtlMs / 1000);

export default {
  createPasswordResetRequest,
  getPasswordResetRecordByToken,
  verifyOtpForRecord,
  markResetRequestConsumed,
  issueResetSessionToken,
  verifyResetSessionToken,
  getPasswordResetMaxAttempts,
  getPasswordResetTtlMinutes,
  getPasswordResetRateLimitWindowSeconds,
  getResetSessionTtlMinutes,
  getResetSessionTtlSeconds,
  buildPasswordResetServiceError
};
