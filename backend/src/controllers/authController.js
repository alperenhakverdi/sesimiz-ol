import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateTokens } from '../middleware/auth.js';
import { cleanupOldAvatar } from '../middleware/upload.js';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Validation rules
export const registerValidation = [
  body('nickname')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Kullanıcı adı 2-20 karakter arası olmalıdır')
    .matches(/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam, _, - karakterleri içerebilir'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
    
  body('password')
    .isLength({ min: 6, max: 50 })
    .withMessage('Şifre 6-50 karakter arası olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir')
];

export const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Kullanıcı adı veya email gereklidir'),
    
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
];

export const updateProfileValidation = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Kullanıcı adı 2-20 karakter arası olmalıdır')
    .matches(/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam, _, - karakterleri içerebilir'),
    
  body('email')
    .optional()
    .isEmail()
    .withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail()
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mevcut şifre gereklidir'),
    
  body('newPassword')
    .isLength({ min: 6, max: 50 })
    .withMessage('Yeni şifre 6-50 karakter arası olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Yeni şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir')
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
        details: errors.array()
      }
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
      where: { nickname }
    });

    if (existingNickname) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NICKNAME_EXISTS',
          message: 'Bu kullanıcı adı zaten kullanılıyor'
        }
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Bu email adresi zaten kullanılıyor'
          }
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
      avatar: req.processedFile ? req.processedFile.url : null
    };

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        nickname: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      },
      message: 'Hesap başarıyla oluşturuldu'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Hesap oluşturulurken bir hata oluştu'
      }
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
        OR: [
          { nickname: identifier },
          { email: identifier }
        ],
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Kullanıcı adı/email veya şifre hatalı'
        }
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Kullanıcı adı/email veya şifre hatalı'
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Return user data without password
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      data: {
        user: userData,
        tokens: {
          accessToken,
          refreshToken
        }
      },
      message: 'Giriş başarılı'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_ERROR',
        message: 'Giriş yapılurken bir hata oluştu'
      }
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const userId = req.userId; // From refresh token middleware

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken: newRefreshToken
        }
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_REFRESH_ERROR',
        message: 'Token yenilenirken hata oluştu'
      }
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
      message: 'Profil bilgileri alındı'
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Profil bilgileri alınırken hata oluştu'
      }
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
        where: { nickname }
      });

      if (existingNickname && existingNickname.id !== userId) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'NICKNAME_EXISTS',
            message: 'Bu kullanıcı adı zaten kullanılıyor'
          }
        });
      }
    }

    // Check if email is being changed and if it's available
    if (email && email !== req.user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Bu email adresi zaten kullanılıyor'
          }
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
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profil başarıyla güncellendi'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Profil güncellenirken hata oluştu'
      }
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
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Mevcut şifre hatalı'
        }
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_ERROR',
        message: 'Şifre değiştirilirken hata oluştu'
      }
    });
  }
};

// Deactivate account (soft delete)
export const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Hesap başarıyla deaktive edildi'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DEACTIVATE_ERROR',
        message: 'Hesap deaktive edilirken hata oluştu'
      }
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
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
};