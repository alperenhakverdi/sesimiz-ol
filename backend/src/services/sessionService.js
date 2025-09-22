import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { issueTokenPair } from './authTokens.js';
import { parseDurationToMs } from '../utils/time.js';
import { logSecurityEvent } from './securityLogger.js';

const prisma = new PrismaClient();

const REFRESH_TTL_MS = parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d', 7 * 24 * 60 * 60 * 1000);
const ABSOLUTE_TTL_MS = parseDurationToMs(`${process.env.SESSION_ABSOLUTE_TTL_DAYS || 30}d`, 30 * 24 * 60 * 60 * 1000);
const INACTIVITY_TIMEOUT_MS = parseDurationToMs(`${process.env.SESSION_INACTIVITY_TIMEOUT_HOURS || 24}h`, 24 * 60 * 60 * 1000);

const now = () => new Date();
const addMs = (ms) => new Date(Date.now() + ms);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const computeExpiry = () => addMs(REFRESH_TTL_MS);

const computeAbsoluteExpiry = (createdAt) => new Date(new Date(createdAt).getTime() + ABSOLUTE_TTL_MS);

const hasExpired = (session) => session.expiresAt <= now();

export const createSessionWithTokens = async ({ user, userAgent, ipAddress }) => {
  const expiresAt = computeExpiry();

  return prisma.$transaction(async (tx) => {
    const placeholderHash = hashToken(crypto.randomUUID());

    const session = await tx.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: placeholderHash,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        geolocation: null,
        expiresAt,
        lastSeenAt: now()
      }
    });

    const tokens = issueTokenPair({
      userId: user.id,
      role: user.role,
      sessionId: session.id,
      isBanned: user.isBanned,
      emailVerified: user.emailVerified
    });

    const hashedRefresh = hashToken(tokens.refreshToken);

    const persistedSession = await tx.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: hashedRefresh }
    });

    logSecurityEvent({
      event: 'SESSION_CREATED',
      userId: user.id,
      ip: ipAddress,
      meta: { sessionId: session.id }
    });

    return {
      session: persistedSession,
      tokens
    };
  });
};

export const findActiveSessionForRefresh = async ({ userId, sessionId, refreshToken }) => {

  const hashed = hashToken(refreshToken);


  const session = await prisma.userSession.findFirst({
    where: {
      userId,
      ...(sessionId ? { id: sessionId } : {}),
      revokedAt: null
    }
  });


  if (session) {

  }

  if (!session) {
    return null;
  }

  if (session.refreshTokenHash !== hashed) {
    console.error('Refresh token hash mismatch!');
    return null;
  }

  if (hasExpired(session)) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        revokedAt: now(),
        revocationReason: 'expired'
      }
    });
    return null;
  }

  return session;
};

export const touchSession = async (sessionId) => {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { lastSeenAt: now() }
  });
};

export const revokeSession = async (sessionId, reason = 'manual') => {
  await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: {
      revokedAt: now(),
      revocationReason: reason
    }
  });
};

export const revokeAllSessions = async (userId, reason = 'manual') => {
  await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: {
      revokedAt: now(),
      revocationReason: reason
    }
  });
};

export const pruneExpiredSessions = async (userId) => {
  const result = await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: {
        lte: now()
      }
    },
    data: {
      revokedAt: now(),
      revocationReason: 'expired'
    }
  });

  if (result.count > 0) {
    logSecurityEvent({
      event: 'SESSION_PRUNED_EXPIRED',
      userId,
      meta: { count: result.count }
    });
  }
};

export const rotateSession = async ({
  session,
  user,
  refreshToken,
  userAgent,
  ipAddress
}) => {
  const expiresAt = computeExpiry();

  return prisma.$transaction(async (tx) => {
    const placeholderHash = hashToken(crypto.randomUUID());

    const newSession = await tx.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: placeholderHash,
        userAgent: userAgent || session.userAgent,
        ipAddress: ipAddress || session.ipAddress,
        geolocation: session.geolocation,
        expiresAt,
        lastSeenAt: now()
      }
    });

    const tokens = issueTokenPair({
      userId: user.id,
      role: user.role,
      sessionId: newSession.id,
      isBanned: user.isBanned,
      emailVerified: user.emailVerified
    });

    const hashedRefresh = hashToken(tokens.refreshToken);

    const persistedSession = await tx.userSession.update({
      where: { id: newSession.id },
      data: { refreshTokenHash: hashedRefresh }
    });

    await tx.userSession.update({
      where: { id: session.id },
      data: {
        revokedAt: now(),
        revocationReason: 'rotated',
        replacedBySessionId: persistedSession.id
      }
    });

    logSecurityEvent({
      event: 'SESSION_ROTATED',
      userId: user.id,
      ip: ipAddress,
      meta: { previousSessionId: session.id, newSessionId: persistedSession.id }
    });

    return {
      session: persistedSession,
      tokens
    };
  });
};

export const verifyAbsoluteTtl = (session) => {
  const absoluteExpiry = computeAbsoluteExpiry(session.createdAt);
  return absoluteExpiry > now();
};

export const hasExceededInactivity = (session) => {
  if (!INACTIVITY_TIMEOUT_MS) {
    return false;
  }
  const threshold = new Date(Date.now() - INACTIVITY_TIMEOUT_MS);
  return new Date(session.lastSeenAt) < threshold;
};