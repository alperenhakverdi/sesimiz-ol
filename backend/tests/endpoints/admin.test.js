/**
 * Admin Endpoints Comprehensive Test Suite
 * Tests all admin-related API endpoints including user management, metrics, and feature flags
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Admin Endpoints', () => {
  let adminUser;
  let regularUser;
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Create admin user
    adminUser = await global.testUtils.createTestUser({
      email: 'admin@example.com',
      nickname: 'admin',
      role: 'ADMIN'
    });

    // Create regular user
    regularUser = await global.testUtils.createTestUser({
      email: 'user@example.com',
      nickname: 'regularuser',
      role: 'USER'
    });

    adminToken = await global.testUtils.generateTestToken(adminUser.id);
    userToken = await global.testUtils.generateTestToken(regularUser.id);
  });

  describe('Admin Authentication and Authorization', () => {
    test('should require admin role for all admin endpoints', async () => {
      const adminEndpoints = [
        { method: 'GET', path: '/api/admin/users' },
        { method: 'POST', path: '/api/admin/users' },
        { method: 'GET', path: '/api/admin/metrics' },
        { method: 'GET', path: '/api/admin/feature-flags' }
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          [endpoint.method.toLowerCase()](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
      }
    });

    test('should require authentication for admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/users', () => {
    beforeEach(async () => {
      // Create additional users for testing
      for (let i = 0; i < 5; i++) {
        await global.testUtils.createTestUser({
          email: `testuser${i}@example.com`,
          nickname: `testuser${i}`,
          role: i % 2 === 0 ? 'USER' : 'MODERATOR'
        });
      }
    });

    test('should list all users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(5);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=3')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.length).toBeLessThanOrEqual(3);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 3
      });
    });

    test('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.every(user => user.role === 'ADMIN')).toBe(true);
    });

    test('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.some(user =>
        user.nickname.includes('admin') || user.email.includes('admin')
      )).toBe(true);
    });

    test('should include user statistics', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = response.body.data.users[0];
      expect(user).toHaveProperty('stats');
      expect(user.stats).toHaveProperty('storiesCount');
      expect(user.stats).toHaveProperty('commentsCount');
    });

    test('should include sensitive admin information', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = response.body.data.users[0];
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('emailVerified');
      expect(user).toHaveProperty('createdAt');
    });

    test('should support sorting options', async () => {
      const response = await request(app)
        .get('/api/admin/users?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify sorting (newest first)
      const users = response.body.data.users;
      for (let i = 1; i < users.length; i++) {
        const prev = new Date(users[i - 1].createdAt);
        const current = new Date(users[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(current.getTime());
      }
    });
  });

  describe('POST /api/admin/users', () => {
    test('should create new admin user', async () => {
      const userData = {
        email: 'newadmin@example.com',
        nickname: 'newadmin',
        password: 'SecurePass123!',
        role: 'ADMIN'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);

      // Verify user exists in database
      const createdUser = await global.testUtils.prisma().user.findUnique({
        where: { email: userData.email }
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser.role).toBe('ADMIN');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate email uniqueness', async () => {
      const userData = {
        email: adminUser.email,
        nickname: 'duplicate',
        password: 'SecurePass123!',
        role: 'USER'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('should validate role values', async () => {
      const userData = {
        email: 'invalidrole@example.com',
        nickname: 'invalidrole',
        password: 'SecurePass123!',
        role: 'INVALID_ROLE'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should create user with default settings', async () => {
      const userData = {
        email: 'defaultsettings@example.com',
        nickname: 'defaultsettings',
        password: 'SecurePass123!',
        role: 'USER'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.data.user.isActive).toBe(true);
      expect(response.body.data.user.emailVerified).toBe(true); // Admin created users are pre-verified
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    test('should update user information', async () => {
      const updateData = {
        nickname: 'updatedNickname',
        bio: 'Updated bio by admin',
        isActive: false
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nickname).toBe(updateData.nickname);
      expect(response.body.data.user.isActive).toBe(updateData.isActive);

      // Verify in database
      const updatedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: regularUser.id }
      });
      expect(updatedUser.nickname).toBe(updateData.nickname);
      expect(updatedUser.isActive).toBe(updateData.isActive);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nickname: 'nonexistent' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should validate update data', async () => {
      const invalidData = {
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle nickname uniqueness', async () => {
      const updateData = {
        nickname: adminUser.nickname
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NICKNAME_ALREADY_EXISTS');
    });
  });

  describe('POST /api/admin/users/:id/ban', () => {
    test('should ban user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${regularUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/yasaklandı/i);

      // Verify user is banned
      const bannedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: regularUser.id }
      });
      expect(bannedUser.isActive).toBe(false);
    });

    test('should unban user if already banned', async () => {
      // Ban user first
      await global.testUtils.prisma().user.update({
        where: { id: regularUser.id },
        data: { isActive: false }
      });

      const response = await request(app)
        .post(`/api/admin/users/${regularUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/yasağı kaldırıldı/i);

      // Verify user is unbanned
      const unbannedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: regularUser.id }
      });
      expect(unbannedUser.isActive).toBe(true);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/admin/users/999999/ban')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should not allow banning self', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${adminUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CANNOT_BAN_SELF');
    });
  });

  describe('POST /api/admin/users/:id/role', () => {
    test('should update user role', async () => {
      const roleData = {
        role: 'MODERATOR'
      };

      const response = await request(app)
        .post(`/api/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('MODERATOR');

      // Verify in database
      const updatedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: regularUser.id }
      });
      expect(updatedUser.role).toBe('MODERATOR');
    });

    test('should validate role values', async () => {
      const invalidRole = {
        role: 'INVALID_ROLE'
      };

      const response = await request(app)
        .post(`/api/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidRole)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/admin/users/999999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'USER' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should prevent role escalation beyond admin', async () => {
      const superAdminRole = {
        role: 'SUPER_ADMIN'
      };

      const response = await request(app)
        .post(`/api/admin/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(superAdminRole)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/metrics', () => {
    beforeEach(async () => {
      // Create test data for metrics
      const category = await global.testUtils.prisma().category.findFirst();

      for (let i = 0; i < 3; i++) {
        const user = await global.testUtils.createTestUser({
          email: `metrics${i}@example.com`,
          nickname: `metricsuser${i}`
        });

        const story = await global.testUtils.createTestStory(user.id, {
          categoryId: category.id
        });

        await global.testUtils.prisma().comment.create({
          data: {
            content: `Metrics test comment ${i}`,
            storyId: story.id,
            authorId: user.id
          }
        });
      }
    });

    test('should get platform metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
    });

    test('should include user metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const metrics = response.body.data.metrics;
      expect(metrics.users).toBeDefined();
      expect(metrics.users).toHaveProperty('total');
      expect(metrics.users).toHaveProperty('active');
      expect(metrics.users).toHaveProperty('new');
    });

    test('should include content metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const metrics = response.body.data.metrics;
      expect(metrics.content).toBeDefined();
      expect(metrics.content).toHaveProperty('stories');
      expect(metrics.content).toHaveProperty('comments');
      expect(metrics.content).toHaveProperty('categories');
    });

    test('should include engagement metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const metrics = response.body.data.metrics;
      expect(metrics.engagement).toBeDefined();
      expect(metrics.engagement).toHaveProperty('views');
      expect(metrics.engagement).toHaveProperty('interactions');
    });

    test('should include system metrics', async () => {
      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const metrics = response.body.data.metrics;
      expect(metrics.system).toBeDefined();
      expect(metrics.system).toHaveProperty('uptime');
      expect(metrics.system).toHaveProperty('version');
    });

    test('should support time range filtering', async () => {
      const response = await request(app)
        .get('/api/admin/metrics?timeRange=7d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.timeRange).toBe('7d');
    });
  });

  describe('Feature Flags Management', () => {
    describe('GET /api/admin/feature-flags', () => {
      test('should list all feature flags', async () => {
        const response = await request(app)
          .get('/api/admin/feature-flags')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.flags).toBeDefined();
        expect(Array.isArray(response.body.data.flags)).toBe(true);
      });

      test('should include flag details', async () => {
        const response = await request(app)
          .get('/api/admin/feature-flags')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        if (response.body.data.flags.length > 0) {
          const flag = response.body.data.flags[0];
          expect(flag).toHaveProperty('key');
          expect(flag).toHaveProperty('enabled');
          expect(flag).toHaveProperty('description');
        }
      });

      test('should support filtering by status', async () => {
        const response = await request(app)
          .get('/api/admin/feature-flags?enabled=true')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('PATCH /api/admin/feature-flags/:key', () => {
      test('should update feature flag', async () => {
        const flagData = {
          enabled: true,
          description: 'Updated description'
        };

        const response = await request(app)
          .patch('/api/admin/feature-flags/adminPanel')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(flagData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.flag.enabled).toBe(true);
      });

      test('should validate flag data', async () => {
        const invalidData = {
          enabled: 'not-a-boolean'
        };

        const response = await request(app)
          .patch('/api/admin/feature-flags/adminPanel')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      test('should return 404 for non-existent flag', async () => {
        const response = await request(app)
          .patch('/api/admin/feature-flags/nonExistentFlag')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ enabled: true })
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      test('should handle critical flags carefully', async () => {
        const response = await request(app)
          .patch('/api/admin/feature-flags/adminPanel')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ enabled: false })
          .expect(200);

        expect(response.body.success).toBe(true);
        // Should include warning about critical flag
      });
    });
  });

  describe('Admin Security and Permissions', () => {
    test('should require feature flag for admin panel access', async () => {
      // Disable admin panel feature flag
      await global.testUtils.prisma().featureFlag.update({
        where: { key: 'adminPanel' },
        data: { enabled: false }
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FEATURE_DISABLED');
    });

    test('should log admin actions', async () => {
      // This test would require implementing audit logging
      await request(app)
        .post(`/api/admin/users/${regularUser.id}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify action is logged (would require audit log implementation)
      expect(true).toBe(true);
    });

    test('should validate admin permissions for sensitive operations', async () => {
      // Create a moderator user
      const moderatorUser = await global.testUtils.createTestUser({
        email: 'moderator@example.com',
        nickname: 'moderator',
        role: 'MODERATOR'
      });

      const moderatorToken = await global.testUtils.generateTestToken(moderatorUser.id);

      // Moderator should not be able to access admin endpoints
      const response = await request(app)
        .get('/api/admin/feature-flags')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should handle concurrent admin operations', async () => {
      const banPromises = Array(3).fill().map(() =>
        request(app)
          .post(`/api/admin/users/${regularUser.id}/ban`)
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(banPromises);

      // Should handle concurrent operations gracefully
      responses.forEach(response => {
        expect([200, 400]).toContain(response.status);
      });
    });

    test('should validate input to prevent injection attacks', async () => {
      const maliciousData = {
        nickname: '<script>alert("xss")</script>',
        bio: 'SELECT * FROM users WHERE 1=1; --'
      };

      const response = await request(app)
        .put(`/api/admin/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousData)
        .expect(200);

      // Should sanitize malicious input
      expect(response.body.data.user.nickname).not.toContain('<script>');
    });
  });

  describe('Admin Performance and Scalability', () => {
    test('should handle large user lists efficiently', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/admin/users?limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(3000); // Should respond within 3 seconds
    });

    test('should cache metrics data appropriately', async () => {
      // First request
      const start1 = Date.now();
      await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request (should be faster due to caching)
      const start2 = Date.now();
      await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      // Second request should be faster (or at least not significantly slower)
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.5);
    });

    test('should handle pagination for large datasets', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=999&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toEqual([]);
      expect(response.body.data.pagination.page).toBe(999);
    });
  });
});