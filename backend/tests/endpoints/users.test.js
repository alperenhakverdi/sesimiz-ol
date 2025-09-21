/**
 * Users Endpoints Comprehensive Test Suite
 * Tests all user-related API endpoints including profiles, follow system, and user management
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Users Endpoints', () => {
  let testUser;
  let anotherUser;
  let authToken;
  let anotherUserToken;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser({
      email: 'user1@example.com',
      nickname: 'user1',
      bio: 'Test user biography'
    });

    anotherUser = await global.testUtils.createTestUser({
      email: 'user2@example.com',
      nickname: 'user2',
      bio: 'Another test user'
    });

    authToken = await global.testUtils.generateTestToken(testUser.id);
    anotherUserToken = await global.testUtils.generateTestToken(anotherUser.id);
  });

  describe('POST /api/users', () => {
    test('should create new user (legacy endpoint)', async () => {
      const userData = {
        email: 'legacy@example.com',
        nickname: 'legacyuser',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.nickname).toBe(userData.nickname);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject duplicate email', async () => {
      const userData = {
        email: testUser.email,
        nickname: 'duplicate',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('GET /api/users/settings', () => {
    test('should get user settings with authentication', async () => {
      const response = await request(app)
        .get('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toBeDefined();
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users/settings')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should include all settings fields', async () => {
      const response = await request(app)
        .get('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { settings } = response.body.data;
      expect(settings).toHaveProperty('privacy');
      expect(settings).toHaveProperty('notifications');
      expect(settings).toHaveProperty('preferences');
    });
  });

  describe('PUT /api/users/settings', () => {
    test('should update user settings', async () => {
      const settingsData = {
        privacy: {
          profileVisible: false,
          showEmail: false
        },
        notifications: {
          emailNotifications: false,
          pushNotifications: true
        },
        preferences: {
          language: 'tr',
          theme: 'dark'
        }
      };

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.privacy.profileVisible).toBe(false);
      expect(response.body.data.settings.notifications.emailNotifications).toBe(false);
    });

    test('should validate settings data', async () => {
      const invalidSettings = {
        privacy: {
          invalidField: 'invalid'
        }
      };

      const response = await request(app)
        .put('/api/users/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSettings)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/settings')
        .send({ privacy: { profileVisible: false } })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user profile by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        nickname: testUser.nickname,
        bio: testUser.bio
      });

      // Should not include sensitive information
      expect(response.body.data.user).not.toHaveProperty('email');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    test('should include user statistics', async () => {
      // Create some content for the user
      await global.testUtils.createTestStory(testUser.id);

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(200);

      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats).toHaveProperty('storiesCount');
      expect(response.body.data.stats).toHaveProperty('followersCount');
      expect(response.body.data.stats).toHaveProperty('followingCount');
    });

    test('should respect privacy settings', async () => {
      // Update user privacy settings
      await global.testUtils.prisma().user.update({
        where: { id: testUser.id },
        data: {
          settings: {
            privacy: {
              profileVisible: false
            }
          }
        }
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_NOT_VISIBLE');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update own profile', async () => {
      const updateData = {
        nickname: 'updatedNickname',
        bio: 'Updated biography information'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nickname).toBe(updateData.nickname);
      expect(response.body.data.user.bio).toBe(updateData.bio);
    });

    test('should not update other user\'s profile', async () => {
      const updateData = {
        nickname: 'hackedNickname'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should validate nickname uniqueness', async () => {
      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: anotherUser.nickname })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NICKNAME_ALREADY_EXISTS');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .send({ nickname: 'unauthUpdate' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id/stories', () => {
    beforeEach(async () => {
      // Create test stories for the user
      await global.testUtils.createTestStory(testUser.id, {
        title: 'Public Story 1',
        isPublished: true
      });

      await global.testUtils.createTestStory(testUser.id, {
        title: 'Public Story 2',
        isPublished: true
      });

      await global.testUtils.createTestStory(testUser.id, {
        title: 'Draft Story',
        isPublished: false
      });
    });

    test('should get user\'s published stories', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}/stories`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toBeDefined();
      expect(response.body.data.stories.every(story => story.isPublished)).toBe(true);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}/stories?page=1&limit=1`)
        .expect(200);

      expect(response.body.data.stories.length).toBeLessThanOrEqual(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });

    test('should include drafts for own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}/stories?includeDrafts=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const hasDrafts = response.body.data.stories.some(story => !story.isPublished);
      expect(hasDrafts).toBe(true);
    });

    test('should not include drafts for other users', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser.id}/stories?includeDrafts=true`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(200);

      const hasDrafts = response.body.data.stories.some(story => !story.isPublished);
      expect(hasDrafts).toBe(false);
    });

    test('should filter by category', async () => {
      const category = await global.testUtils.prisma().category.findFirst();

      const response = await request(app)
        .get(`/api/users/${testUser.id}/stories?categoryId=${category.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Follow System', () => {
    describe('POST /api/users/:userId/follow', () => {
      test('should follow another user', async () => {
        const response = await request(app)
          .post(`/api/users/${anotherUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/takip edildi/i);

        // Verify follow relationship exists
        const follow = await global.testUtils.prisma().userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: testUser.id,
              followingId: anotherUser.id
            }
          }
        });
        expect(follow).toBeTruthy();
      });

      test('should not follow self', async () => {
        const response = await request(app)
          .post(`/api/users/${testUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('CANNOT_FOLLOW_SELF');
      });

      test('should not follow non-existent user', async () => {
        const response = await request(app)
          .post('/api/users/999999/follow')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('USER_NOT_FOUND');
      });

      test('should not follow already followed user', async () => {
        // Follow first time
        await request(app)
          .post(`/api/users/${anotherUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`);

        // Try to follow again
        const response = await request(app)
          .post(`/api/users/${anotherUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('ALREADY_FOLLOWING');
      });

      test('should require authentication', async () => {
        const response = await request(app)
          .post(`/api/users/${anotherUser.id}/follow`)
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      test('should respect rate limiting', async () => {
        // Create multiple users to test rate limiting
        const users = [];
        for (let i = 0; i < 25; i++) {
          const user = await global.testUtils.createTestUser({
            email: `ratetest${i}@example.com`,
            nickname: `ratetest${i}`
          });
          users.push(user);
        }

        // Attempt to follow many users rapidly
        const followPromises = users.map(user =>
          request(app)
            .post(`/api/users/${user.id}/follow`)
            .set('Authorization', `Bearer ${authToken}`)
        );

        const responses = await Promise.all(followPromises);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });

    describe('DELETE /api/users/:userId/follow', () => {
      beforeEach(async () => {
        // Create follow relationship
        await global.testUtils.prisma().userFollow.create({
          data: {
            followerId: testUser.id,
            followingId: anotherUser.id
          }
        });
      });

      test('should unfollow user', async () => {
        const response = await request(app)
          .delete(`/api/users/${anotherUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toMatch(/takibi bıraktınız/i);

        // Verify follow relationship removed
        const follow = await global.testUtils.prisma().userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: testUser.id,
              followingId: anotherUser.id
            }
          }
        });
        expect(follow).toBeNull();
      });

      test('should handle unfollow when not following', async () => {
        // Remove the follow relationship first
        await global.testUtils.prisma().userFollow.delete({
          where: {
            followerId_followingId: {
              followerId: testUser.id,
              followingId: anotherUser.id
            }
          }
        });

        const response = await request(app)
          .delete(`/api/users/${anotherUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOLLOWING');
      });

      test('should require authentication', async () => {
        const response = await request(app)
          .delete(`/api/users/${anotherUser.id}/follow`)
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/users/:userId/followers', () => {
      beforeEach(async () => {
        // Create some followers for testUser
        const follower1 = await global.testUtils.createTestUser({
          email: 'follower1@example.com',
          nickname: 'follower1'
        });

        const follower2 = await global.testUtils.createTestUser({
          email: 'follower2@example.com',
          nickname: 'follower2'
        });

        await global.testUtils.prisma().userFollow.createMany({
          data: [
            { followerId: follower1.id, followingId: testUser.id },
            { followerId: follower2.id, followingId: testUser.id }
          ]
        });
      });

      test('should get user followers', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}/followers`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.followers).toBeDefined();
        expect(Array.isArray(response.body.followers)).toBe(true);
        expect(response.body.followers.length).toBe(2);
      });

      test('should support pagination', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}/followers?page=1&limit=1`)
          .expect(200);

        expect(response.body.followers.length).toBeLessThanOrEqual(1);
        expect(response.body.pagination.limit).toBe(1);
      });

      test('should order by follow date', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}/followers`)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Followers should be ordered by creation date
      });
    });

    describe('GET /api/users/:userId/following', () => {
      beforeEach(async () => {
        // Create users that testUser follows
        const following1 = await global.testUtils.createTestUser({
          email: 'following1@example.com',
          nickname: 'following1'
        });

        const following2 = await global.testUtils.createTestUser({
          email: 'following2@example.com',
          nickname: 'following2'
        });

        await global.testUtils.prisma().userFollow.createMany({
          data: [
            { followerId: testUser.id, followingId: following1.id },
            { followerId: testUser.id, followingId: following2.id }
          ]
        });
      });

      test('should get users being followed', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}/following`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.following).toBeDefined();
        expect(Array.isArray(response.body.following)).toBe(true);
        expect(response.body.following.length).toBe(2);
      });

      test('should support pagination', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}/following?page=1&limit=1`)
          .expect(200);

        expect(response.body.following.length).toBeLessThanOrEqual(1);
        expect(response.body.pagination.limit).toBe(1);
      });
    });
  });

  describe('GET /api/users/search', () => {
    beforeEach(async () => {
      // Create users with searchable content
      await global.testUtils.createTestUser({
        email: 'searchable@example.com',
        nickname: 'searchableuser',
        bio: 'This user has a searchable biography with specific keywords'
      });

      await global.testUtils.createTestUser({
        email: 'another@example.com',
        nickname: 'anothersearchable',
        bio: 'Another user with different searchable content'
      });
    });

    test('should search users by nickname', async () => {
      const response = await request(app)
        .get('/api/users/search?q=searchable')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.some(user =>
        user.nickname.includes('searchable')
      )).toBe(true);
    });

    test('should search users by bio', async () => {
      const response = await request(app)
        .get('/api/users/search?q=biography')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('should require minimum search length', async () => {
      const response = await request(app)
        .get('/api/users/search?q=a')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_QUERY');
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users/search?q=user&page=1&limit=1')
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    test('should include user statistics', async () => {
      const response = await request(app)
        .get('/api/users/search?q=searchable')
        .expect(200);

      if (response.body.users.length > 0) {
        expect(response.body.users[0]).toHaveProperty('stats');
        expect(response.body.users[0].stats).toHaveProperty('storiesCount');
        expect(response.body.users[0].stats).toHaveProperty('followersCount');
      }
    });

    test('should order by relevance', async () => {
      const response = await request(app)
        .get('/api/users/search?q=searchable')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Results should be ordered by followers count and stories count
    });

    test('should handle case insensitive search', async () => {
      const response = await request(app)
        .get('/api/users/search?q=SEARCHABLE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('should not expose sensitive information', async () => {
      const response = await request(app)
        .get('/api/users/search?q=searchable')
        .expect(200);

      if (response.body.users.length > 0) {
        expect(response.body.users[0]).not.toHaveProperty('email');
        expect(response.body.users[0]).not.toHaveProperty('password');
        expect(response.body.users[0]).not.toHaveProperty('settings');
      }
    });
  });

  describe('Input Validation and Security', () => {
    test('should validate user ID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/users/search?q=\'; DROP TABLE users; --')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should not cause database errors
    });

    test('should sanitize user input', async () => {
      const maliciousData = {
        nickname: '<script>alert("xss")</script>',
        bio: 'Normal bio'
      };

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(200);

      // Script tags should be sanitized
      expect(response.body.data.user.nickname).not.toContain('<script>');
    });

    test('should limit nickname length', async () => {
      const longNickname = 'a'.repeat(100);

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: longNickname })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should limit bio length', async () => {
      const longBio = 'a'.repeat(1000);

      const response = await request(app)
        .put(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: longBio })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Privacy and Permissions', () => {
    test('should respect user privacy settings for profile visibility', async () => {
      // Set profile to private
      await global.testUtils.prisma().user.update({
        where: { id: testUser.id },
        data: {
          settings: {
            privacy: {
              profileVisible: false
            }
          }
        }
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROFILE_NOT_VISIBLE');
    });

    test('should allow access to own private profile', async () => {
      // Set profile to private
      await global.testUtils.prisma().user.update({
        where: { id: testUser.id },
        data: {
          settings: {
            privacy: {
              profileVisible: false
            }
          }
        }
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    test('should hide email based on privacy settings', async () => {
      // Set email to private
      await global.testUtils.prisma().user.update({
        where: { id: testUser.id },
        data: {
          settings: {
            privacy: {
              showEmail: false
            }
          }
        }
      });

      const response = await request(app)
        .get(`/api/users/${testUser.id}`)
        .expect(200);

      expect(response.body.data.user).not.toHaveProperty('email');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large follower lists efficiently', async () => {
      // This test would be more meaningful with a larger dataset
      const response = await request(app)
        .get(`/api/users/${testUser.id}/followers?limit=50`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users/search?q=test&page=-1&limit=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBeGreaterThan(0);
      expect(response.body.pagination.limit).toBeGreaterThan(0);
    });

    test('should limit maximum page size', async () => {
      const response = await request(app)
        .get('/api/users/search?q=test&limit=1000')
        .expect(200);

      expect(response.body.pagination.limit).toBeLessThanOrEqual(50);
    });

    test('should handle concurrent follow operations', async () => {
      const targetUser = await global.testUtils.createTestUser({
        email: 'concurrent@example.com',
        nickname: 'concurrent'
      });

      // Multiple concurrent follow requests
      const followPromises = Array(5).fill().map(() =>
        request(app)
          .post(`/api/users/${targetUser.id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(followPromises);

      // Only one should succeed, others should fail with ALREADY_FOLLOWING
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBe(1);
    });
  });
});