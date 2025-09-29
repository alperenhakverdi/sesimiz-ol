import { body, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import {
  listFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag as updateFeatureFlagRecord,
  listFeatureFlagDefaults,
  refreshFeatureFlags
} from '../services/featureFlags.js';
import logSecurityEvent from '../services/securityLogger.js';

const prisma = new PrismaClient();

export const listFeatureFlagsValidation = [];

export const updateFeatureFlagValidation = [
  param('key')
    .trim()
    .notEmpty()
    .withMessage('Feature flag anahtarı gereklidir'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('enabled değeri boolean olmalıdır')
    .toBoolean(),
  body('rolloutStatus')
    .optional()
    .isString()
    .withMessage('rolloutStatus metin olmalıdır')
    .isLength({ max: 120 })
    .withMessage('rolloutStatus en fazla 120 karakter olabilir'),
  body('description')
    .optional()
    .isString()
    .withMessage('description metin olmalıdır')
    .isLength({ max: 500 })
    .withMessage('description 500 karakteri aşamaz'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('metadata JSON nesnesi olmalıdır')
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

const notifyAdminsOfChange = async ({ key, enabled, actorId }) => {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true }
  });

  if (!admins.length) {
    return;
  }

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: 'SYSTEM',
      title: `Feature flag güncellendi: ${key}`,
      message: `"${key}" özelliği ${enabled ? 'aktif' : 'pasif'} hale getirildi.`,
      data: {
        key,
        enabled,
        actorId
      }
    }))
  });
};

export const listFeatureFlagsController = async (req, res, next) => {
  try {
    const flags = await listFeatureFlags();
    const defaults = listFeatureFlagDefaults();

    return res.json({
      success: true,
      data: {
        flags,
        defaults
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const updateFeatureFlagController = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return respondValidationError(res, errors);
  }

  const key = req.params.key;
  const { enabled, rolloutStatus, description, metadata } = req.body;
  const actorId = req.user?.id ?? null;

  try {
    const existing = await getFeatureFlag(key);
    if (!existing && !listFeatureFlagDefaults()[key]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FLAG_NOT_FOUND',
          message: `${key} isimli feature flag tanımlı değil`
        }
      });
    }

    const updated = await updateFeatureFlagRecord({
      key,
      enabled,
      rolloutStatus,
      description,
      metadata,
      userId: actorId
    });

    await notifyAdminsOfChange({ key, enabled: updated.enabled, actorId });
    await refreshFeatureFlags({ force: true });

    logSecurityEvent({
      event: 'FEATURE_FLAG_UPDATED',
      userId: actorId,
      ip: req.ip,
      meta: {
        key,
        enabled: updated.enabled,
        rolloutStatus: updated.rolloutStatus ?? null
      }
    });

    return res.json({
      success: true,
      data: {
        flag: updated
      }
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  listFeatureFlagsValidation,
  listFeatureFlagsController,
  updateFeatureFlagValidation,
  updateFeatureFlagController
};
