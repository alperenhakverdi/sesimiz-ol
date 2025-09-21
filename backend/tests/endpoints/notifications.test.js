/**
 * Notifications Endpoints Comprehensive Test Suite
 * Tests all notification-related API endpoints
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Notifications Endpoints', () => {
  let testUser;
  let anotherUser;
  let authToken;
  let anotherUserToken;
  let testNotification;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser({
      email: 'notified@example.com',
      nickname: 'notified'
    });

    anotherUser = await global.testUtils.createTestUser({
      email: 'sender@example.com',
      nickname: 'sender'
    });

    authToken = await global.testUtils.generateTestToken(testUser.id);
    anotherUserToken = await global.testUtils.generateTestToken(anotherUser.id);

    // Create test notifications
    testNotification = await global.testUtils.prisma().notification.create({
      data: {
        userId: testUser.id,
        type: 'COMMENT',
        title: 'New Comment',
        message: 'Someone commented on your story',
        data: {
          storyId: 1,
          commentId: 1
        }
      }
    });
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      // Create multiple notifications for testing
      for (let i = 0; i < 5; i++) {
        await global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: i % 2 === 0 ? 'COMMENT' : 'FOLLOW',
            title: `Test Notification ${i}`,
            message: `Test message ${i}`,
            data: { testData: i },
            readAt: i < 2 ? new Date() : null
          }
        });
      }
    });

    test('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should include unread count', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.unreadCount).toBeDefined();
      expect(typeof response.body.unreadCount).toBe('number');
      expect(response.body.unreadCount).toBeGreaterThan(0);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2
      });
    });

    test('should filter by notification type', async () => {
      const response = await request(app)
        .get('/api/notifications?type=COMMENT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(n => n.type === 'COMMENT')).toBe(true);
    });

    test('should filter by read status', async () => {
      // Test unread notifications
      const unreadResponse = await request(app)
        .get('/api/notifications?status=unread')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(unreadResponse.body.data.every(n => n.readAt === null)).toBe(true);

      // Test read notifications
      const readResponse = await request(app)
        .get('/api/notifications?status=read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(readResponse.body.data.every(n => n.readAt !== null)).toBe(true);
    });

    test('should order by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const notifications = response.body.data;
      for (let i = 1; i < notifications.length; i++) {
        const prev = new Date(notifications[i - 1].createdAt);
        const current = new Date(notifications[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(current.getTime());
      }
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should only return user\'s own notifications', async () => {
      // Create notification for another user
      await global.testUtils.prisma().notification.create({
        data: {
          userId: anotherUser.id,
          type: 'COMMENT',
          title: 'Other User Notification',
          message: 'This should not appear',
          data: {}
        }
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not contain other user's notifications
      expect(response.body.data.every(n =>
        !n.title.includes('Other User')
      )).toBe(true);
    });

    test('should handle large page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/notifications?page=999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('should validate page size limits', async () => {
      const response = await request(app)
        .get('/api/notifications?limit=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBeLessThanOrEqual(50);
    });
  });

  describe('PUT /api/notifications/:notificationId/read', () => {
    test('should mark single notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(1);

      // Verify notification is marked as read
      const updatedNotification = await global.testUtils.prisma().notification.findUnique({
        where: { id: testNotification.id }
      });
      expect(updatedNotification.readAt).toBeTruthy();
    });

    test('should handle already read notification', async () => {
      // Mark as read first
      await global.testUtils.prisma().notification.update({
        where: { id: testNotification.id },
        data: { readAt: new Date() }
      });

      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(0);
    });

    test('should mark all notifications as read', async () => {
      // Create unread notifications
      for (let i = 0; i < 3; i++) {
        await global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: 'COMMENT',
            title: `Unread ${i}`,
            message: `Unread message ${i}`,
            data: {}
          }
        });
      }

      const response = await request(app)
        .put('/api/notifications/all/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBeGreaterThan(0);
      expect(response.body.unreadCount).toBe(0);
    });

    test('should mark bulk notifications as read', async () => {
      // Create multiple unread notifications
      const notifications = [];
      for (let i = 0; i < 3; i++) {
        const notification = await global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: 'COMMENT',
            title: `Bulk ${i}`,
            message: `Bulk message ${i}`,
            data: {}
          }
        });
        notifications.push(notification);
      }

      const ids = notifications.map(n => n.id);

      const response = await request(app)
        .put('/api/notifications/bulk/read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(3);
    });

    test('should validate bulk notification IDs', async () => {
      const response = await request(app)
        .put('/api/notifications/bulk/read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ids: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });

    test('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .put('/api/notifications/999999/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    });

    test('should not mark other user\'s notifications', async () => {
      const otherNotification = await global.testUtils.prisma().notification.create({
        data: {
          userId: anotherUser.id,
          type: 'COMMENT',
          title: 'Other User Notification',
          message: 'Should not be accessible',
          data: {}
        }
      });

      const response = await request(app)
        .put(`/api/notifications/${otherNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid notification ID format', async () => {
      const response = await request(app)
        .put('/api/notifications/not-a-number/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_NOTIFICATION_ID');
    });

    test('should update unread count correctly', async () => {
      // Create multiple unread notifications
      for (let i = 0; i < 3; i++) {
        await global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: 'COMMENT',
            title: `Count Test ${i}`,
            message: `Count message ${i}`,
            data: {}
          }
        });
      }

      // Mark one as read
      const response = await request(app)
        .put(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.unreadCount).toBeDefined();
      expect(typeof response.body.unreadCount).toBe('number');
    });
  });

  describe('Notification Security and Edge Cases', () => {
    test('should handle SQL injection attempts', async () => {
      const maliciousId = "1; DROP TABLE notifications; --";

      const response = await request(app)
        .put(`/api/notifications/${encodeURIComponent(maliciousId)}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      // Should not cause database errors
    });

    test('should handle large number of notifications efficiently', async () => {
      // Create many notifications
      const notificationPromises = Array(100).fill().map((_, i) =>
        global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: 'COMMENT',
            title: `Performance Test ${i}`,
            message: `Performance message ${i}`,
            data: { index: i }
          }
        })
      );

      await Promise.all(notificationPromises);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/notifications?limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(20);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle concurrent read operations', async () => {
      // Create unread notifications
      const notifications = [];
      for (let i = 0; i < 5; i++) {
        const notification = await global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: 'COMMENT',
            title: `Concurrent Test ${i}`,
            message: `Concurrent message ${i}`,
            data: {}
          }
        });
        notifications.push(notification);
      }

      // Concurrent mark as read operations
      const readPromises = notifications.map(n =>
        request(app)
          .put(`/api/notifications/${n.id}/read`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(readPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should validate notification type enum', async () => {
      const response = await request(app)
        .get('/api/notifications?type=INVALID_TYPE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should handle invalid types gracefully
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    test('should handle pagination edge cases', async () => {
      // Test negative page numbers
      const negativePageResponse = await request(app)
        .get('/api/notifications?page=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(negativePageResponse.body.pagination.page).toBeGreaterThan(0);

      // Test zero limit
      const zeroLimitResponse = await request(app)
        .get('/api/notifications?limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(zeroLimitResponse.body.pagination.limit).toBeGreaterThan(0);
    });

    test('should not expose sensitive information in notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const notification = response.body.data[0];

        // Should not include internal system data
        expect(notification).not.toHaveProperty('internalData');
        expect(notification).not.toHaveProperty('systemMetadata');
      }
    });
  });

  describe('Notification Types and Data Structure', () => {
    test('should handle different notification types', async () => {
      const notificationTypes = [
        { type: 'COMMENT', title: 'New Comment', message: 'Someone commented' },
        { type: 'FOLLOW', title: 'New Follower', message: 'Someone followed you' },
        { type: 'LIKE', title: 'Story Liked', message: 'Someone liked your story' },
        { type: 'MENTION', title: 'You were mentioned', message: 'Someone mentioned you' }
      ];

      for (const notifType of notificationTypes) {
        await global.testUtils.prisma().notification.create({
          data: {
            userId: testUser.id,
            type: notifType.type,
            title: notifType.title,
            message: notifType.message,
            data: { testType: notifType.type }
          }
        });
      }

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const receivedTypes = response.body.data.map(n => n.type);
      notificationTypes.forEach(nt => {
        expect(receivedTypes).toContain(nt.type);
      });
    });

    test('should preserve notification data structure', async () => {
      const complexData = {
        storyId: 123,
        commentId: 456,
        authorName: 'Test Author',
        metadata: {
          source: 'web',
          timestamp: '2024-01-01T00:00:00Z'
        }
      };

      await global.testUtils.prisma().notification.create({
        data: {
          userId: testUser.id,
          type: 'COMMENT',
          title: 'Complex Data Test',
          message: 'Testing complex data structure',
          data: complexData
        }
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const complexNotification = response.body.data.find(n =>
        n.title === 'Complex Data Test'
      );

      expect(complexNotification).toBeTruthy();
      expect(complexNotification.data.storyId).toBe(123);
      expect(complexNotification.data.metadata.source).toBe('web');
    });

    test('should handle empty notification data', async () => {
      await global.testUtils.prisma().notification.create({
        data: {
          userId: testUser.id,
          type: 'SYSTEM',
          title: 'System Notification',
          message: 'System message',
          data: {}
        }
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const systemNotification = response.body.data.find(n =>
        n.type === 'SYSTEM'
      );

      expect(systemNotification).toBeTruthy();
      expect(systemNotification.data).toEqual({});
    });
  });
});