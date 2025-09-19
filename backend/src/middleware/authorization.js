import logSecurityEvent from '../services/securityLogger.js';
import { isFeatureEnabled } from '../services/featureFlags.js';

const respondForbidden = (res, message = 'Bu işlem için yetkiniz yok') =>
  res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message
    }
  });

export const requireFeature = (flag) => (req, res, next) => {
  if (!isFeatureEnabled(flag)) {
    return respondForbidden(res, 'Bu özellik şu anda devre dışı');
  }
  return next();
};

export const requireRole = (...roles) => (req, res, next) => {
  const user = req.user;
  if (!user || !roles.includes(user.role)) {
    logSecurityEvent({
      event: 'AUTHORIZATION_DENIED',
      userId: user?.id || null,
      ip: req.ip,
      meta: {
        requiredRoles: roles
      }
    });
    return respondForbidden(res);
  }
  return next();
};

export const requirePermission = (permission, checker) => async (req, res, next) => {
  try {
    const user = req.user;
    const allowed = await checker(user, req);
    if (!allowed) {
      logSecurityEvent({
        event: 'PERMISSION_DENIED',
        userId: user?.id || null,
        ip: req.ip,
        meta: { permission }
      });
      return respondForbidden(res);
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export default {
  requireFeature,
  requireRole,
  requirePermission
};
