import express from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

const normalizePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const normalizeLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const resolveTypeFilter = (rawType) => {
  if (!rawType) return undefined;
  const upper = String(rawType).toUpperCase();
  return Object.prototype.hasOwnProperty.call(NotificationType, upper)
    ? upper
    : undefined;
};

const resolveReadFilter = (status) => {
  if (!status) return undefined;
  const normalized = String(status).toLowerCase();
  if (normalized === 'unread') {
    return null;
  }
  if (normalized === 'read') {
    return { not: null };
  }
  return undefined;
};

router.use(authenticateToken);

// GET /api/notifications - Listeleme (sayfalama + filtreleme)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const skip = (page - 1) * limit;
    const typeFilter = resolveTypeFilter(req.query.type);
    const readFilter = resolveReadFilter(req.query.status);

    const where = {
      userId,
      ...(typeof readFilter === 'object' || readFilter === null ? { readAt: readFilter } : {}),
      ...(typeFilter ? { type: typeFilter } : {})
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } })
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 0
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Bildirimler getirilemedi'
      }
    });
  }
});

const markNotificationsRead = async ({ userId, ids, markAll }) => {
  const whereBase = { userId, readAt: null };
  const where = markAll ? whereBase : { ...whereBase, id: { in: ids } };

  const result = await prisma.notification.updateMany({
    where,
    data: {
      readAt: new Date()
    }
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, readAt: null }
  });

  return { updated: result.count, unreadCount };
};

// PUT /api/notifications/:id/read - tekli veya çoklu okundu işaretleme
router.put('/:notificationId/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    if (notificationId === 'bulk') {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Okundu işaretlemek için en az bir bildirim ID gerekli'
          }
        });
      }

      const { updated, unreadCount } = await markNotificationsRead({ userId, ids });
      return res.json({ success: true, updated, unreadCount });
    }

    if (notificationId === 'all') {
      const { updated, unreadCount } = await markNotificationsRead({ userId, markAll: true });
      return res.json({ success: true, updated, unreadCount });
    }

    const id = Number.parseInt(notificationId, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NOTIFICATION_ID',
          message: 'Geçersiz bildirim ID'
        }
      });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Bildirim bulunamadı'
        }
      });
    }

    if (notification.readAt) {
      const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });
      return res.json({ success: true, updated: 0, unreadCount });
    }

    await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null }
    });

    return res.json({ success: true, updated: 1, unreadCount });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Bildirim güncellenemedi'
      }
    });
  }
});

export default router;