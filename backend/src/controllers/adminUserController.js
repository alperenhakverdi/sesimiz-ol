import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validationResult, query, body } from 'express-validator';
import logSecurityEvent from '../services/securityLogger.js';

const prisma = new PrismaClient();

export const listUsersValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim(),
  query('role').optional().isIn(Object.values(Role))
];

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

export const listAdminUsers = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const search = req.query.search || '';
  const roleFilter = req.query.role;

  const where = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(search
      ? {
          OR: [
            { nickname: { contains: search } },
            { email: { contains: search } }
          ]
        }
      : {})
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        email: true,
        role: true,
        isActive: true,
        isBanned: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        lockedUntil: true
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  });
};

export const createAdminUserValidation = [
  body('nickname').isLength({ min: 2, max: 20 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
];

export const createAdminUser = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const { nickname, email, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ nickname }, { email }]
    }
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USER_EXISTS',
        message: 'Bu kullanıcı adı veya email zaten kullanılıyor'
      }
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      nickname,
      email,
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: true
    },
    select: {
      id: true,
      nickname: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  logSecurityEvent({
    event: 'ADMIN_CREATED',
    userId: req.user?.id || null,
    ip: req.ip,
    meta: { targetUserId: user.id }
  });

  res.status(201).json({
    success: true,
    data: { user }
  });
};

export const updateAdminUserValidation = [
  body('nickname').optional().isLength({ min: 2, max: 20 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('isBanned').optional().isBoolean(),
  body('role').optional().isIn(Object.values(Role))
];

export const updateAdminUser = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const userId = Number(req.params.id);
  const { nickname, email, isBanned, role } = req.body;

  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId }
      }
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Bu email adresi başka bir kullanıcı tarafından kullanılıyor'
        }
      });
    }
  }

  if (nickname) {
    const existingNickname = await prisma.user.findFirst({
      where: {
        nickname,
        NOT: { id: userId }
      }
    });

    if (existingNickname) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NICKNAME_EXISTS',
          message: 'Bu kullanıcı adı başka bir kullanıcı tarafından kullanılıyor'
        }
      });
    }
  }

  const data = {};
  if (nickname !== undefined) data.nickname = nickname;
  if (email !== undefined) data.email = email;
  if (isBanned !== undefined) data.isBanned = isBanned;
  if (role !== undefined) {
    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Geçersiz rol'
        }
      });
    }
    data.role = role;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      nickname: true,
      email: true,
      role: true,
      isBanned: true,
      emailVerified: true,
      lockedUntil: true,
      updatedAt: true
    }
  });

  logSecurityEvent({
    event: 'ADMIN_USER_UPDATED',
    userId: req.user?.id || null,
    ip: req.ip,
    meta: { targetUserId: updated.id }
  });

  res.json({
    success: true,
    data: { user: updated }
  });
};

export const toggleUserBan = async (req, res) => {
  const userId = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isBanned: true }
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: !user.isBanned },
    select: {
      id: true,
      nickname: true,
      email: true,
      role: true,
      isBanned: true
    }
  });

  logSecurityEvent({
    event: updated.isBanned ? 'ADMIN_USER_BANNED' : 'ADMIN_USER_UNBANNED',
    userId: req.user?.id || null,
    ip: req.ip,
    meta: { targetUserId: updated.id }
  });

  res.json({
    success: true,
    data: { user: updated }
  });
};

export const updateUserRoleValidation = [
  body('role').isIn(Object.values(Role)).withMessage('Geçersiz rol')
];

export const updateUserRole = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  const userId = Number(req.params.id);
  const { role } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      nickname: true,
      email: true,
      role: true
    }
  });

  logSecurityEvent({
    event: 'ADMIN_USER_ROLE_CHANGED',
    userId: req.user?.id || null,
    ip: req.ip,
    meta: { targetUserId: updated.id, role }
  });

  res.json({
    success: true,
    data: { user: updated }
  });
};

export default {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserBan,
  updateUserRole,
  listUsersValidation,
  createAdminUserValidation,
  updateAdminUserValidation
};
