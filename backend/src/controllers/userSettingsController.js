import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { userSettingsSelect, defaultUserSettings } from '../utils/userProfile.js';

const prisma = new PrismaClient();

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Girilen ayar değerleri geçersiz',
        details: errors.array(),
      },
    });
    return true;
  }
  return false;
};

export const updateSettingsValidation = [
  body('profileVisibility')
    .optional()
    .isIn(['PUBLIC', 'COMMUNITY', 'PRIVATE'])
    .withMessage('Geçersiz profil görünürlüğü seçeneği'),
  body('commentPermission')
    .optional()
    .isIn(['EVERYONE', 'FOLLOWERS', 'NONE'])
    .withMessage('Geçersiz yorum izni seçeneği'),
  body('searchVisibility')
    .optional()
    .isBoolean()
    .withMessage('Arama görünürlüğü değeri boolean olmalıdır')
    .toBoolean(),
  body('theme')
    .optional()
    .isIn(['SYSTEM', 'LIGHT', 'DARK'])
    .withMessage('Geçersiz tema tercihi'),
  body('fontSize')
    .optional()
    .isIn(['SMALL', 'MEDIUM', 'LARGE'])
    .withMessage('Geçersiz yazı boyutu seçeneği'),
  body('reducedMotion')
    .optional()
    .isBoolean()
    .withMessage('Animasyon tercihi boolean olmalıdır')
    .toBoolean(),
];

export const getUserSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await prisma.userSettings.findUnique({
      where: { userId },
      select: userSettingsSelect,
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
        select: userSettingsSelect,
      });
    }

    res.json({
      success: true,
      data: { settings: settings || { ...defaultUserSettings } },
    });
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SETTINGS_ERROR',
        message: 'Ayarlar alınırken bir hata oluştu',
      },
    });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const userId = req.user.id;
    const {
      profileVisibility,
      commentPermission,
      searchVisibility,
      theme,
      fontSize,
      reducedMotion,
    } = req.body;

    const updateData = {};

    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (commentPermission !== undefined) updateData.commentPermission = commentPermission;
    if (searchVisibility !== undefined) updateData.searchVisibility = searchVisibility;
    if (theme !== undefined) updateData.theme = theme;
    if (fontSize !== undefined) updateData.fontSize = fontSize;
    if (reducedMotion !== undefined) updateData.reducedMotion = reducedMotion;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
      select: userSettingsSelect,
    });

    if (req.user) {
      req.user.settings = settings;
    }

    res.json({
      success: true,
      data: { settings },
      message: 'Ayarlar başarıyla güncellendi',
    });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_SETTINGS_ERROR',
        message: 'Ayarlar güncellenirken bir hata oluştu',
      },
    });
  }
};
