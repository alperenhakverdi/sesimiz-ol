import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createPasswordResetRequest,
  getPasswordResetMaxAttempts,
  getPasswordResetTtlMinutes,
  verifyOtpForRecord,
  issueResetSessionToken,
  verifyResetSessionToken,
  getResetSessionTtlMinutes,
  buildPasswordResetServiceError
} from '../services/passwordResetService.js';
import { sendPasswordResetEmail } from '../services/passwordResetEmail.js';
import logSecurityEvent from '../services/securityLogger.js';
import { passwordValidator } from '../utils/validators.js';
import { revokeAllSessions } from '../services/sessionService.js';

const prisma = new PrismaClient();

export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail()
];

export const verifyOtpValidation = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Token gereklidir'),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Doğrulama kodu 6 haneli olmalıdır')
    .matches(/^[0-9]+$/)
    .withMessage('Doğrulama kodu yalnızca rakamlardan oluşmalıdır')
];

export const resetPasswordValidation = [
  body('resetToken')
    .trim()
    .notEmpty()
    .withMessage('Şifre sıfırlama oturumu gereklidir'),
  passwordValidator('password')
];

const respondValidationError = (res, errors) =>
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Girilen bilgiler geçersiz',
      details: errors.array()
    }
  });

const genericSuccessPayload = () => ({
  success: true,
  message: 'Eğer kayıtlı bir hesabımızda bulunduysanız, sıfırlama talimatları e-posta adresinize gönderildi.',
  data: {
    expiresInMinutes: getPasswordResetTtlMinutes(),
    maxAttempts: getPasswordResetMaxAttempts()
  }
});

const handleServiceError = (error, res) => {
  if (error?.name !== 'PasswordResetServiceError') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Şu anda şifre sıfırlama isteği işlenemiyor. Lütfen daha sonra tekrar deneyin.'
      }
    });
  }

  const payload = {
    success: false,
    error: {
      code: error.code,
      message: error.message
    }
  };

  if (error.retryAfter) {
    payload.error.retryAfter = error.retryAfter;
  }

  return res.status(error.status || 400).json(payload);
};

export const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respondValidationError(res, errors);
  }

  const email = req.body.email;
  const ip = req.ip;
  const userAgent = req.get('user-agent');

  let user;

  try {
    user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nickname: true,
        isActive: true,
        isBanned: true
      }
    });
  } catch (error) {
    console.error('Password reset lookup failed', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Şu anda şifre sıfırlama isteği işlenemiyor. Lütfen daha sonra tekrar deneyin.'
      }
    });
  }

  if (!user || !user.isActive || user.isBanned) {
    if (user?.isBanned) {
      logSecurityEvent({
        event: 'PASSWORD_RESET_REQUEST_BLOCKED',
        userId: user.id,
        ip,
        meta: {
          reason: user.isBanned ? 'user_banned' : 'user_inactive'
        }
      });
    }

    return res.json(genericSuccessPayload());
  }

  try {
    const resetRequest = await createPasswordResetRequest({
      userId: user.id,
      email: user.email,
      ip,
      userAgent
    });

    await sendPasswordResetEmail({
      email: user.email,
      nickname: user.nickname,
      otp: resetRequest.otp,
      token: resetRequest.token,
      expiresAt: resetRequest.expiresAt
    });

    logSecurityEvent({
      event: 'PASSWORD_RESET_EMAIL_SENT',
      userId: user.id,
      ip,
      meta: {
        resetId: resetRequest.id,
        expiresAt: resetRequest.expiresAt.toISOString()
      }
    });

    return res.json(genericSuccessPayload());
  } catch (error) {
    if (error?.name === 'PasswordResetServiceError') {
      return handleServiceError(error, res);
    }

    console.error('Password reset email error', error);

    logSecurityEvent({
      event: 'PASSWORD_RESET_EMAIL_FAILED',
      userId: user.id,
      ip,
      meta: {
        error: error.message
      }
    });

    // To avoid revealing internal state, respond with generic success even if email fails.
    return res.json(genericSuccessPayload());
  }
};

export const verifyOtp = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respondValidationError(res, errors);
  }

  const { token, otp } = req.body;
  const ip = req.ip;
  const userAgent = req.get('user-agent');

  try {
    const record = await verifyOtpForRecord({ token, otp, ip, userAgent });

    const resetToken = issueResetSessionToken({
      resetRequestId: record.id,
      userId: record.userId
    });

    logSecurityEvent({
      event: 'PASSWORD_RESET_OTP_VERIFIED',
      userId: record.userId,
      ip,
      meta: {
        resetId: record.id,
        expiresAt: record.expiresAt?.toISOString?.() || record.expiresAt
      }
    });

    return res.json({
      success: true,
      data: {
        resetToken,
        expiresInMinutes: getResetSessionTtlMinutes()
      }
    });
  } catch (error) {
    if (error?.name === 'PasswordResetServiceError') {
      return handleServiceError(error, res);
    }

    console.error('Password reset OTP verification failed', error);

    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Şu anda şifre sıfırlama isteği işlenemiyor. Lütfen daha sonra tekrar deneyin.'
      }
    });
  }
};

export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respondValidationError(res, errors);
  }

  const { resetToken, password } = req.body;
  let payload;

  try {
    payload = verifyResetSessionToken(resetToken);
  } catch (error) {
    if (error?.name === 'PasswordResetServiceError') {
      return handleServiceError(error, res);
    }

    console.error('Password reset session verification failed', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Şu anda şifre sıfırlama isteği işlenemiyor. Lütfen daha sonra tekrar deneyin.'
      }
    });
  }

  const resetRequestId = Number(payload?.rid);
  const userIdFromToken = Number(payload?.uid);

  if (!Number.isFinite(resetRequestId) || !Number.isFinite(userIdFromToken)) {
    return handleServiceError(
      buildPasswordResetServiceError(
        'PASSWORD_RESET_SESSION_INVALID',
        'Şifre sıfırlama oturumu geçersiz.',
        { status: 401 }
      ),
      res
    );
  }

  let resetRequest;

  try {
    resetRequest = await prisma.passwordResetToken.findUnique({
      where: { id: resetRequestId }
    });
  } catch (error) {
    console.error('Password reset lookup failed', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Şu anda şifre sıfırlama isteği işlenemiyor. Lütfen daha sonra tekrar deneyin.'
      }
    });
  }

  if (!resetRequest || resetRequest.userId !== userIdFromToken) {
    return handleServiceError(
      buildPasswordResetServiceError(
        'PASSWORD_RESET_SESSION_INVALID',
        'Şifre sıfırlama oturumu geçersiz.',
        { status: 401 }
      ),
      res
    );
  }

  const now = new Date();
  if (resetRequest.expiresAt && new Date(resetRequest.expiresAt) <= now) {
    return handleServiceError(
      buildPasswordResetServiceError(
        'PASSWORD_RESET_TOKEN_EXPIRED',
        'Şifre sıfırlama isteğinizin süresi dolmuştur.',
        { status: 410 }
      ),
      res
    );
  }

  if (!resetRequest.verifiedAt) {
    return handleServiceError(
      buildPasswordResetServiceError(
        'PASSWORD_RESET_NOT_VERIFIED',
        'Şifre sıfırlama isteği doğrulanmadı.',
        { status: 400 }
      ),
      res
    );
  }

  if (resetRequest.consumedAt) {
    return handleServiceError(
      buildPasswordResetServiceError(
        'PASSWORD_RESET_TOKEN_CONSUMED',
        'Bu şifre sıfırlama isteği zaten tamamlandı.',
        { status: 409 }
      ),
      res
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const ip = req.ip;
  const userAgent = req.get('user-agent');
  const completedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRequest.userId },
        data: {
          password: hashedPassword,
          failedLoginCount: 0,
          lastFailedLoginAt: null,
          lockedUntil: null
        }
      });

      await tx.passwordResetToken.update({
        where: { id: resetRequest.id },
        data: {
          consumedAt: completedAt,
          metadata: {
            ...(resetRequest.metadata ?? {}),
            completedAt: completedAt.toISOString(),
            completedIp: ip || null,
            completedUserAgent: userAgent || null
          }
        }
      });
    });
  } catch (error) {
    console.error('Password reset transaction failed', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_FAILED',
        message: 'Şifre sıfırlama işlemi gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.'
      }
    });
  }

  await revokeAllSessions(resetRequest.userId, 'password_reset');

  logSecurityEvent({
    event: 'PASSWORD_RESET_COMPLETED',
    userId: resetRequest.userId,
    ip,
    meta: { resetId: resetRequest.id }
  });

  return res.json({
    success: true,
    message: 'Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.'
  });
};


export default {
  forgotPassword,
  forgotPasswordValidation,
  verifyOtp,
  verifyOtpValidation,
  resetPassword,
  resetPasswordValidation
};
