/**
 * Bookmarks Endpoints Comprehensive Test Suite
 * Tests all bookmark-related API endpoints
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Bookmarks Endpoints', () => {
  let testUser;
  let anotherUser;
  let authToken;
  let anotherUserToken;
  let testStory;
  let anotherStory;

  beforeEach(async () => {
    // Create test users
    testUser = await global.testUtils.createTestUser({
      email: 'bookmarker@example.com',
      nickname: 'bookmarker'
    });

    anotherUser = await global.testUtils.createTestUser({
      email: 'author@example.com',
      nickname: 'author'
    });

    authToken = await global.testUtils.generateTestToken(testUser.id);
    anotherUserToken = await global.testUtils.generateTestToken(anotherUser.id);

    // Create test stories
    testStory = await global.testUtils.createTestStory(anotherUser.id, {
      title: 'Story to Bookmark'
    });

    anotherStory = await global.testUtils.createTestStory(anotherUser.id, {
      title: 'Another Story'
    });
  });

  describe('POST /api/bookmarks/:storyId', () => {
    test('should add story to bookmarks', async () => {
      const response = await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/yer imlerine eklendi/i);

      // Verify bookmark exists in database
      const bookmark = await global.testUtils.prisma().userBookmark.findUnique({
        where: {
          userId_storyId: {
            userId: testUser.id,
            storyId: testStory.id
          }
        }
      });
      expect(bookmark).toBeTruthy();
    });

    test('should return 404 for non-existent story', async () => {
      const response = await request(app)
        .post('/api/bookmarks/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STORY_NOT_FOUND');
    });

    test('should not allow duplicate bookmarks', async () => {
      // First bookmark
      await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second bookmark attempt
      const response = await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_BOOKMARKED');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed story ID', async () => {
      const response = await request(app)
        .post('/api/bookmarks/not-a-number')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should allow different users to bookmark same story', async () => {
      // First user bookmarks
      await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second user bookmarks same story
      const response = await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify both bookmarks exist
      const bookmarkCount = await global.testUtils.prisma().userBookmark.count({
        where: { storyId: testStory.id }
      });
      expect(bookmarkCount).toBe(2);
    });
  });

  describe('DELETE /api/bookmarks/:storyId', () => {
    beforeEach(async () => {
      // Create a bookmark to remove
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: testUser.id,
          storyId: testStory.id
        }
      });
    });

    test('should remove story from bookmarks', async () => {
      const response = await request(app)
        .delete(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/yer imlerinden kaldırıldı/i);

      // Verify bookmark is removed from database
      const bookmark = await global.testUtils.prisma().userBookmark.findUnique({
        where: {
          userId_storyId: {
            userId: testUser.id,
            storyId: testStory.id
          }
        }
      });
      expect(bookmark).toBeNull();
    });

    test('should return 404 when bookmark does not exist', async () => {
      // Remove bookmark first
      await global.testUtils.prisma().userBookmark.delete({
        where: {
          userId_storyId: {
            userId: testUser.id,
            storyId: testStory.id
          }
        }
      });

      const response = await request(app)
        .delete(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BOOKMARK_NOT_FOUND');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/bookmarks/${testStory.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed story ID', async () => {
      const response = await request(app)
        .delete('/api/bookmarks/not-a-number')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should only remove user\'s own bookmark', async () => {
      // Another user creates bookmark for same story
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: anotherUser.id,
          storyId: testStory.id
        }
      });

      // First user removes their bookmark
      await request(app)
        .delete(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second user's bookmark should still exist
      const remainingBookmark = await global.testUtils.prisma().userBookmark.findUnique({
        where: {
          userId_storyId: {
            userId: anotherUser.id,
            storyId: testStory.id
          }
        }
      });
      expect(remainingBookmark).toBeTruthy();
    });
  });

  describe('GET /api/bookmarks', () => {
    beforeEach(async () => {
      // Create multiple bookmarks for testing
      const stories = [];
      for (let i = 0; i < 5; i++) {
        const story = await global.testUtils.createTestStory(anotherUser.id, {
          title: `Bookmarked Story ${i}`
        });
        stories.push(story);

        await global.testUtils.prisma().userBookmark.create({
          data: {
            userId: testUser.id,
            storyId: story.id
          }
        });

        // Add a small delay to ensure different creation times
        await global.testUtils.wait(10);
      }
    });

    test('should get user\'s bookmarked stories', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookmarks).toBeDefined();
      expect(Array.isArray(response.body.bookmarks)).toBe(true);
      expect(response.body.bookmarks.length).toBe(5);
    });

    test('should include complete story information', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks[0];
      expect(bookmark).toHaveProperty('id');
      expect(bookmark).toHaveProperty('bookmarkedAt');
      expect(bookmark.story).toBeDefined();
      expect(bookmark.story).toHaveProperty('id');
      expect(bookmark.story).toHaveProperty('title');
      expect(bookmark.story).toHaveProperty('content');
      expect(bookmark.story).toHaveProperty('author');
      expect(bookmark.story).toHaveProperty('category');
      expect(bookmark.story).toHaveProperty('tags');
      expect(bookmark.story).toHaveProperty('commentCount');
    });

    test('should truncate story content', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks[0];
      expect(bookmark.story.content.length).toBeLessThanOrEqual(203); // 200 + "..."
    });

    test('should order bookmarks by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmarks = response.body.bookmarks;
      for (let i = 1; i < bookmarks.length; i++) {
        const prev = new Date(bookmarks[i - 1].bookmarkedAt);
        const current = new Date(bookmarks[i].bookmarkedAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(current.getTime());
      }
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/bookmarks?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.bookmarks.length).toBe(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 5,
        pages: 3
      });
    });

    test('should handle pagination edge cases', async () => {
      // Test large page number
      const response1 = await request(app)
        .get('/api/bookmarks?page=999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body.bookmarks).toEqual([]);

      // Test invalid limit
      const response2 = await request(app)
        .get('/api/bookmarks?limit=1000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response2.body.pagination.limit).toBeLessThanOrEqual(50);
    });

    test('should return empty array when user has no bookmarks', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookmarks).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should only return user\'s own bookmarks', async () => {
      // Another user creates bookmarks
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: anotherUser.id,
          storyId: testStory.id
        }
      });

      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only get testUser's bookmarks (5), not anotherUser's
      expect(response.body.bookmarks.length).toBe(5);
      expect(response.body.bookmarks.every(b =>
        b.story.id !== testStory.id
      )).toBe(true);
    });

    test('should include author information correctly', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks[0];
      expect(bookmark.story.author).toMatchObject({
        id: anotherUser.id,
        nickname: anotherUser.nickname
      });
    });

    test('should include category information', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks[0];
      expect(bookmark.story.category).toBeDefined();
      expect(bookmark.story.category).toHaveProperty('name');
      expect(bookmark.story.category).toHaveProperty('slug');
      expect(bookmark.story.category).toHaveProperty('color');
    });

    test('should include tags information', async () => {
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks[0];
      expect(bookmark.story.tags).toBeDefined();
      expect(Array.isArray(bookmark.story.tags)).toBe(true);
    });
  });

  describe('GET /api/bookmarks/check/:storyId', () => {
    test('should return true for bookmarked story', async () => {
      // Create bookmark
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: testUser.id,
          storyId: testStory.id
        }
      });

      const response = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isBookmarked).toBe(true);
      expect(response.body.bookmarkedAt).toBeTruthy();
    });

    test('should return false for non-bookmarked story', async () => {
      const response = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isBookmarked).toBe(false);
      expect(response.body.bookmarkedAt).toBeNull();
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed story ID', async () => {
      const response = await request(app)
        .get('/api/bookmarks/check/not-a-number')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should work for any story ID (even non-existent)', async () => {
      const response = await request(app)
        .get('/api/bookmarks/check/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isBookmarked).toBe(false);
    });

    test('should be user-specific', async () => {
      // User 1 bookmarks story
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: testUser.id,
          storyId: testStory.id
        }
      });

      // Check with user 1
      const response1 = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body.isBookmarked).toBe(true);

      // Check with user 2
      const response2 = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(200);

      expect(response2.body.isBookmarked).toBe(false);
    });
  });

  describe('Bookmark Integration and Edge Cases', () => {
    test('should handle bookmarking and unbookmarking in sequence', async () => {
      // Bookmark
      await request(app)
        .post(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check bookmark exists
      let checkResponse = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(checkResponse.body.isBookmarked).toBe(true);

      // Unbookmark
      await request(app)
        .delete(`/api/bookmarks/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Check bookmark removed
      checkResponse = await request(app)
        .get(`/api/bookmarks/check/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(checkResponse.body.isBookmarked).toBe(false);
    });

    test('should handle concurrent bookmark operations', async () => {
      // Multiple concurrent bookmark requests
      const promises = Array(5).fill().map(() =>
        request(app)
          .post(`/api/bookmarks/${testStory.id}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);

      // Only one should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      const duplicateResponses = responses.filter(r => r.status === 400);

      expect(successfulResponses.length).toBe(1);
      expect(duplicateResponses.length).toBe(4);
    });

    test('should maintain bookmark integrity when story is deleted', async () => {
      // Create bookmark
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: testUser.id,
          storyId: testStory.id
        }
      });

      // Delete story (this should cascade delete bookmarks)
      await global.testUtils.prisma().story.delete({
        where: { id: testStory.id }
      });

      // Bookmark should be automatically removed
      const bookmark = await global.testUtils.prisma().userBookmark.findUnique({
        where: {
          userId_storyId: {
            userId: testUser.id,
            storyId: testStory.id
          }
        }
      });

      expect(bookmark).toBeNull();
    });

    test('should handle large number of bookmarks efficiently', async () => {
      // Create many bookmarks
      const storyPromises = Array(100).fill().map(async (_, i) => {
        const story = await global.testUtils.createTestStory(anotherUser.id, {
          title: `Performance Test Story ${i}`
        });

        return global.testUtils.prisma().userBookmark.create({
          data: {
            userId: testUser.id,
            storyId: story.id
          }
        });
      });

      await Promise.all(storyPromises);

      // Test pagination performance
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/bookmarks?page=1&limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.bookmarks.length).toBe(20);
      expect(response.body.pagination.total).toBe(100);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle bookmarks for stories with complex relationships', async () => {
      // Create story with tags and comments
      const category = await global.testUtils.prisma().category.findFirst();
      const complexStory = await global.testUtils.createTestStory(anotherUser.id, {
        title: 'Complex Story with Relationships',
        categoryId: category.id
      });

      // Add tags
      const tag = await global.testUtils.prisma().tag.findFirst();
      await global.testUtils.prisma().storyTag.create({
        data: {
          storyId: complexStory.id,
          tagId: tag.id
        }
      });

      // Add comments
      await global.testUtils.prisma().comment.create({
        data: {
          content: 'Test comment',
          storyId: complexStory.id,
          authorId: testUser.id
        }
      });

      // Bookmark the complex story
      await request(app)
        .post(`/api/bookmarks/${complexStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get bookmarks and verify all relationships are included
      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks.find(b => b.story.id === complexStory.id);
      expect(bookmark).toBeTruthy();
      expect(bookmark.story.category).toBeTruthy();
      expect(bookmark.story.tags.length).toBeGreaterThan(0);
      expect(bookmark.story.commentCount).toBe(1);
    });
  });

  describe('Bookmark Security and Validation', () => {
    test('should validate story ID format', async () => {
      const response = await request(app)
        .post('/api/bookmarks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle SQL injection attempts', async () => {
      const maliciousId = "1; DROP TABLE user_bookmarks; --";

      const response = await request(app)
        .post(`/api/bookmarks/${encodeURIComponent(maliciousId)}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      // Should not cause database errors
    });

    test('should not expose sensitive information in bookmark data', async () => {
      // Create bookmark
      await global.testUtils.prisma().userBookmark.create({
        data: {
          userId: testUser.id,
          storyId: testStory.id
        }
      });

      const response = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const bookmark = response.body.bookmarks[0];

      // Should not include sensitive user information
      expect(bookmark.story.author).not.toHaveProperty('email');
      expect(bookmark.story.author).not.toHaveProperty('password');

      // Should not include story author's private information
      expect(bookmark).not.toHaveProperty('userId');
    });

    test('should handle invalid pagination parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/bookmarks?page=-1&limit=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBeGreaterThan(0);
      expect(response.body.pagination.limit).toBeGreaterThan(0);
    });
  });
});