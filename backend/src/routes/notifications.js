import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';

const router = express.Router();

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

router.use(authenticateToken);

// GET /api/notifications - Get user notifications with pagination
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = normalizePage(req.query.page);
    const limit = normalizeLimit(req.query.limit);
    const unreadOnly = req.query.unread === 'true';

    const result = await NotificationService.getUserNotifications(userId, page, limit, unreadOnly);

    return res.json({
      success: true,
      notifications: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Bildirimler getirilemedi'
      }
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await NotificationService.getUnreadCount(userId);

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Okunmamış bildirim sayısı alınamadı'
      }
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = Number.parseInt(req.params.notificationId, 10);

    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NOTIFICATION_ID',
          message: 'Geçersiz bildirim ID'
        }
      });
    }

    const result = await NotificationService.markAsRead(notificationId, userId);

    return res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);

    if (error.message === 'Bildirim bulunamadı') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Bildirim güncellenemedi'
      }
    });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await NotificationService.markAllAsRead(userId);

    return res.json({
      success: true,
      count: result.count,
      message: `${result.count} bildirim okundu olarak işaretlendi`
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Bildirimler işaretlenemedi'
      }
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = Number.parseInt(req.params.notificationId, 10);

    if (!Number.isFinite(notificationId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NOTIFICATION_ID',
          message: 'Geçersiz bildirim ID'
        }
      });
    }

    const result = await NotificationService.deleteNotification(notificationId, userId);

    return res.json({
      success: true,
      message: 'Bildirim silindi'
    });
  } catch (error) {
    console.error('Delete notification error:', error);

    if (error.message === 'Bildirim bulunamadı') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: error.message
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Bildirim silinemedi'
      }
    });
  }
});

// POST /api/notifications/test - Test notification (development only)
router.post('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint bulunamadı'
      }
    });
  }

  try {
    const userId = req.user.id;
    const { type = 'SYSTEM', title = 'Test Bildirimi', message = 'Bu bir test bildirimidir.' } = req.body;

    const notification = await NotificationService.create(
      userId,
      type,
      title,
      message,
      { test: true },
      'NORMAL'
    );

    return res.json({
      success: true,
      notification,
      message: 'Test bildirimi gönderildi'
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Test bildirimi gönderilemedi'
      }
    });
  }
});

export default router;