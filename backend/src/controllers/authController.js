import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { cleanupOldAvatar } from '../middleware/upload.js';
import { body, validationResult } from 'express-validator';
import {
  createSessionWithTokens,
  findActiveSessionForRefresh,
  rotateSession,
  revokeSession,
  revokeAllSessions,
  verifyAbsoluteTtl,
  hasExceededInactivity,
  pruneExpiredSessions,
} from '../services/sessionService.js';
import logSecurityEvent from '../services/securityLogger.js';
import {
  nicknameValidator,
  emailValidator,
  passwordValidator,
} from '../utils/validators.js';
import {
  setAuthCookies,
  clearAuthCookies,
  getCookieNames,
} from '../utils/cookies.js';
import {
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
} from '../utils/csrf.js';

const prisma = new PrismaClient();

const LOGIN_FAILURE_LIMIT = Number(process.env.LOGIN_FAILURE_LIMIT || 5);
const ACCOUNT_LOCK_MINUTES = Number(process.env.ACCOUNT_LOCK_MINUTES || 30);

const getLockExpiration = () =>
  new Date(Date.now() + ACCOUNT_LOCK_MINUTES * 60 * 1000);
const remainingLockMinutes = lockedUntil =>
  Math.max(
    0,
    Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 60000)
  );

const respondAccountLocked = (res, lockedUntil) => {
  const minutes = remainingLockMinutes(lockedUntil);
  return res.status(423).json({
    success: false,
    error: {
      code: 'ACCOUNT_LOCKED',
      message: `Çok sayıda başarısız giriş denemesi tespit edildi. Lütfen ${minutes || 1} dakika sonra tekrar deneyin.`,
    },
  });
};

const recordFailedLogin = async (user, identifier, ip) => {
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: { increment: 1 },
      lastFailedLoginAt: new Date(),
    },
    select: {
      id: true,
      failedLoginCount: true,
    },
  });

  logSecurityEvent({
    event: 'LOGIN_FAILED',
    userId: user.id,
    ip,
    meta: {
      identifier,
      failedLoginCount: updated.failedLoginCount,
      limit: LOGIN_FAILURE_LIMIT,
    },
  });

  if (updated.failedLoginCount >= LOGIN_FAILURE_LIMIT) {
    const lockedUntil = getLockExpiration();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil,
      },
    });

    logSecurityEvent({
      event: 'LOGIN_ACCOUNT_LOCKED',
      userId: user.id,
      ip,
      meta: {
        identifier,
        lockedUntil: lockedUntil.toISOString(),
      },
    });

    return lockedUntil;
  }

  return null;
};

// Validation rules
export const registerValidation = [
  nicknameValidator('nickname'),
  emailValidator('email', false),
  passwordValidator('password'),
];

export const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Kullanıcı adı veya email gereklidir'),
  body('password').notEmpty().withMessage('Şifre gereklidir'),
];

export const updateProfileValidation = [
  nicknameValidator('nickname', false),
  emailValidator('email', false),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Mevcut şifre gereklidir'),
  passwordValidator('newPassword'),
];

// Helper function to check validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Girilen bilgiler geçersiz',
        details: errors.array(),
      },
    });
  }
  return null;
};

// Register new user
export const register = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { nickname, email, password } = req.body;

    // Check if nickname already exists
    const existingNickname = await prisma.user.findUnique({
      where: { nickname },
    });

    if (existingNickname) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NICKNAME_EXISTS',
          message: 'Bu kullanıcı adı zaten kullanılıyor',
        },
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Bu email adresi zaten kullanılıyor',
          },
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with avatar if uploaded
    const userData = {
      nickname,
      email: email || null,
      password: hashedPassword,
      avatar: req.processedFile ? req.processedFile.url : null,
    };

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        nickname: true,
        email: true,
        avatar: true,
        role: true,
        isBanned: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    await pruneExpiredSessions(user.id);

    const { tokens } = await createSessionWithTokens({
      user,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    setAuthCookies(res, tokens);
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logSecurityEvent({
      event: 'REGISTER_SUCCESS',
      userId: user.id,
      ip: req.ip,
      meta: { source: 'api' },
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens,
        csrfToken,
      },
      message: 'Hesap başarıyla oluşturuldu',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Hesap oluşturulurken bir hata oluştu',
      },
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { identifier, password } = req.body;

    // Find user by nickname or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ nickname: identifier }, { email: identifier }],
        isActive: true,
      },
    });

    if (!user) {
      logSecurityEvent({
        event: 'LOGIN_UNKNOWN_USER',
        userId: null,
        ip: req.ip,
        meta: { identifier },
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Kullanıcı adı/email veya şifre hatalı',
        },
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'USER_BANNED',
          message: 'Kullanıcı hesabı engellenmiştir',
        },
      });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      logSecurityEvent({
        event: 'LOGIN_LOCK_ENFORCED',
        userId: user.id,
        ip: req.ip,
        meta: { identifier, lockedUntil: user.lockedUntil },
      });
      return respondAccountLocked(res, user.lockedUntil);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const lockedUntil = await recordFailedLogin(user, identifier, req.ip);
      if (lockedUntil) {
        return respondAccountLocked(res, lockedUntil);
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Kullanıcı adı/email veya şifre hatalı',
        },
      });
    }

    // Generate tokens using session service
    await pruneExpiredSessions(user.id);
    const { tokens, session } = await createSessionWithTokens({
      user,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    setAuthCookies(res, tokens);
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    logSecurityEvent({
      event: 'LOGIN_SUCCESS',
      userId: user.id,
      ip: req.ip,
      meta: { sessionId: session.id },
    });

    // Return user data without password or security fields
    const {
      password: _,
      failedLoginCount,
      lastFailedLoginAt,
      lockedUntil,
      ...userData
    } = user;

    res.json({
      success: true,
      data: {
        user: userData,
        tokens,
        csrfToken,
      },
      message: 'Giriş başarılı',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Giriş yapılurken bir hata oluştu',
      },
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const userId = req.userId; // From refresh token middleware
    const sessionId = req.sessionId;
    const { refreshToken: incomingRefreshToken } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatar: true,
        role: true,
        isBanned: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Geçersiz veya devre dışı bırakılmış kullanıcı',
        },
      });
    }

    const session = await findActiveSessionForRefresh({
      userId,
      sessionId,
      refreshToken: incomingRefreshToken,
    });

    if (!session) {
      logSecurityEvent({
        event: 'REFRESH_INVALID_SESSION',
        userId,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token geçersiz veya iptal edilmiş',
        },
      });
    }

    if (!verifyAbsoluteTtl(session) || hasExceededInactivity(session)) {
      await revokeSession(session.id, 'expired');
      logSecurityEvent({
        event: 'REFRESH_EXPIRED_SESSION',
        userId,
        ip: req.ip,
        meta: { sessionId: session.id },
      });
      return res.status(401).json({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_EXPIRED',
          message: 'Oturum süresi doldu',
        },
      });
    }

    const { session: newSession, tokens } = await rotateSession({
      session,
      user,
      refreshToken: incomingRefreshToken,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    setAuthCookies(res, tokens);
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logSecurityEvent({
      event: 'REFRESH_SUCCESS',
      userId,
      ip: req.ip,
      meta: { previousSessionId: session.id, newSessionId: newSession.id },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        tokens,
        csrfToken,
      },
    });

    await pruneExpiredSessions(user.id);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_ERROR',
        message: 'Token yenilenirken hata oluştu',
      },
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = req.user; // From auth middleware

    res.json({
      success: true,
      data: { user },
      message: 'Profil bilgileri alındı',
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Profil bilgileri alınırken hata oluştu',
      },
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const userId = req.user.id;
    const { nickname, email } = req.body;

    // Check if nickname is being changed and if it's available
    if (nickname && nickname !== req.user.nickname) {
      const existingNickname = await prisma.user.findUnique({
        where: { nickname },
      });

      if (existingNickname && existingNickname.id !== userId) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'NICKNAME_EXISTS',
            message: 'Bu kullanıcı adı zaten kullanılıyor',
          },
        });
      }
    }

    // Check if email is being changed and if it's available
    if (email && email !== req.user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Bu email adresi zaten kullanılıyor',
          },
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (email !== undefined) updateData.email = email || null;

    // Handle avatar update
    if (req.processedFile) {
      // Clean up old avatar
      if (req.user.avatar) {
        await cleanupOldAvatar(req.user.avatar);
      }
      updateData.avatar = req.processedFile.url;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nickname: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profil başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Profil güncellenirken hata oluştu',
      },
    });
  }
};

// Change user password
export const changePassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı',
        },
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Mevcut şifre hatalı',
        },
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'Şifre değiştirilirken hata oluştu',
      },
    });
  }
};

// DELETE /api/auth/account - Deactivate account
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
    });

    res.json({
      success: true,
      message: 'Hesap devre dışı bırakıldı',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DEACTIVATE_ERROR',
        message: 'Hesap devre dışı bırakılırken bir hata oluştu',
      },
    });
  }
};

export const issueCsrfToken = (req, res) => {
  const token = generateCsrfToken();
  setCsrfCookie(res, token);

  res.json({
    success: true,
    data: {
      csrfToken: token,
      headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    },
  });
};

export const getSession = (req, res) => {
  const user = req.user;
  const authenticated = !!user;

  let csrfToken = null;
  if (authenticated) {
    csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);
  }

  res.json({
    success: true,
    data: {
      authenticated,
      user: authenticated ? user : null,
      csrfToken,
      headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
    },
  });
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.sessionId || req.body?.sessionId;

    if (sessionId) {
      await revokeSession(Number(sessionId), 'logout');
      logSecurityEvent({
        event: 'LOGOUT_SUCCESS',
        userId: req.user?.id,
        ip: req.ip,
        meta: { sessionId },
      });
    }

    clearAuthCookies(res);
    clearCsrfCookie(res);

    res.json({
      success: true,
      message: 'Oturum başarıyla kapatıldı',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Çıkış yapılırken bir hata oluştu',
      },
    });
  }
};

export const logoutAll = async (req, res) => {
  try {
    if (req.user?.id) {
      await revokeAllSessions(req.user.id, 'logout_all');
      logSecurityEvent({
        event: 'LOGOUT_ALL_SUCCESS',
        userId: req.user.id,
        ip: req.ip,
      });
    }

    clearAuthCookies(res);
    clearCsrfCookie(res);

    res.json({
      success: true,
      message: 'Tüm oturumlardan çıkış yapıldı',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_ALL_ERROR',
        message: 'Oturumlardan çıkış yapılırken hata oluştu',
      },
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
  issueCsrfToken,
  getSession,
  logout,
  logoutAll,
};
