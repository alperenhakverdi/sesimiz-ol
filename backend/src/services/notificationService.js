import { PrismaClient } from '@prisma/client';
import { broadcastToUser, broadcastToAdmins, NOTIFICATION_TYPES } from './socketService.js';
import logSecurityEvent from './securityLogger.js';

const prisma = new PrismaClient();

export class NotificationService {
  // Create a new notification
  static async create(userId, type, title, message, data = {}, priority = 'NORMAL') {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          // Store as JSON object; do not stringify
          data,
          priority,
          read: false,
          createdAt: new Date()
        }
      });

      // Send real-time notification
      const realTimeData = {
        id: notification.id,
        type,
        title,
        message,
        data,
        priority,
        timestamp: notification.createdAt.toISOString(),
        read: false
      };

      const sent = broadcastToUser(userId, 'notification', realTimeData);

      logSecurityEvent({
        event: 'NOTIFICATION_CREATED',
        userId: userId,
        ip: null,
        meta: {
          notificationId: notification.id,
          type,
          priority,
          realTimeSent: sent
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Bildirim oluşturulamadı');
    }
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const where = {
        userId,
        ...(unreadOnly && { read: false })
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            data: true,
            priority: true,
            read: true,
            createdAt: true
          }
        }),
        prisma.notification.count({ where })
      ]);

      return {
        notifications: notifications.map(n => ({
          ...n,
          // Backward/forward compatible decode: accept JSON object or string
          data: typeof n.data === 'string' ? (n.data ? JSON.parse(n.data) : {}) : (n.data || {})
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Bildirimler alınamadı');
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      if (notification.count === 0) {
        throw new Error('Bildirim bulunamadı');
      }

      logSecurityEvent({
        event: 'NOTIFICATION_READ',
        userId: userId,
        ip: null,
        meta: { notificationId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false
        },
        data: {
          read: true,
          readAt: new Date()
        }
      });

      logSecurityEvent({
        event: 'NOTIFICATIONS_BULK_READ',
        userId: userId,
        ip: null,
        meta: { count: result.count }
      });

      return { success: true, count: result.count };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Bildirimler işaretlenemedi');
    }
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId
        }
      });

      if (result.count === 0) {
        throw new Error('Bildirim bulunamadı');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false
        }
      });

      return { count };
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new Error('Okunmamış bildirim sayısı alınamadı');
    }
  }

  // Clean old notifications (older than 30 days)
  static async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          read: true
        }
      });


      return result.count;
    } catch (error) {
      console.error('Error cleaning old notifications:', error);
      throw new Error('Eski bildirimler temizlenemedi');
    }
  }

  // Send notification to admins
  static async notifyAdmins(type, title, message, data = {}) {
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      // Create notifications for all admins
      const notifications = await Promise.all(
        admins.map(admin =>
          this.create(admin.id, type, title, message, data, 'HIGH')
        )
      );

      // Send real-time notification to admin room
      broadcastToAdmins('admin_notification', {
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      return notifications;
    } catch (error) {
      console.error('Error notifying admins:', error);
      throw new Error('Admin bildirimleri gönderilemedi');
    }
  }
}

// Predefined notification helpers
export const NotificationHelpers = {
  // Story related notifications
  async storyApproved(userId, storyTitle) {
    return NotificationService.create(
      userId,
      NOTIFICATION_TYPES.STORY_APPROVED,
      'Hikayen Onaylandı!',
      `"${storyTitle}" başlıklı hikayen onaylandı ve yayınlandı.`,
      { storyTitle },
      'HIGH'
    );
  },

  async storyRejected(userId, storyTitle, reason = '') {
    return NotificationService.create(
      userId,
      NOTIFICATION_TYPES.STORY_REJECTED,
      'Hikaye İncelendi',
      `"${storyTitle}" başlıklı hikayen incelendi. ${reason}`,
      { storyTitle, reason },
      'HIGH'
    );
  },

  async storyCommented(userId, storyTitle, commenterName) {
    return NotificationService.create(
      userId,
      NOTIFICATION_TYPES.STORY_COMMENTED,
      'Yeni Yorum',
      `"${storyTitle}" hikayene ${commenterName} yorum yaptı.`,
      { storyTitle, commenterName },
      'NORMAL'
    );
  },

  // Message notifications
  async messageReceived(userId, senderName, preview) {
    return NotificationService.create(
      userId,
      NOTIFICATION_TYPES.MESSAGE_RECEIVED,
      'Yeni Mesaj',
      `${senderName}: ${preview}`,
      { senderName, preview },
      'HIGH'
    );
  },

  // System notifications
  async systemMaintenance(message, scheduledTime) {
    // Send to all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    return Promise.all(
      users.map(user =>
        NotificationService.create(
          user.id,
          NOTIFICATION_TYPES.SYSTEM_MAINTENANCE,
          'Sistem Bakımı',
          message,
          { scheduledTime },
          'HIGH'
        )
      )
    );
  },

  // Admin notifications
  async contentModerationRequired(storyId, storyTitle, reportCount) {
    return NotificationService.notifyAdmins(
      NOTIFICATION_TYPES.CONTENT_MODERATION,
      'İçerik Moderasyonu Gerekli',
      `"${storyTitle}" hikayesi ${reportCount} şikayet aldı.`,
      { storyId, storyTitle, reportCount }
    );
  }
};

export default NotificationService;
