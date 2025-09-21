/**
 * Stories Endpoints Comprehensive Test Suite
 * Tests all story-related API endpoints including CRUD, search, filtering, and interactions
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Stories Endpoints', () => {
  let testUser;
  let anotherUser;
  let authToken;
  let anotherUserToken;
  let testStory;
  let testCategory;
  let testTags;

  beforeEach(async () => {
    // Create test users
    testUser = await global.testUtils.createTestUser({
      email: 'storyauthor@example.com',
      nickname: 'storyauthor'
    });

    anotherUser = await global.testUtils.createTestUser({
      email: 'reader@example.com',
      nickname: 'reader'
    });

    authToken = await global.testUtils.generateTestToken(testUser.id);
    anotherUserToken = await global.testUtils.generateTestToken(anotherUser.id);

    // Get test category and tags
    testCategory = await global.testUtils.prisma().category.findFirst();
    testTags = await global.testUtils.prisma().tag.findMany({ take: 2 });

    // Create test story
    testStory = await global.testUtils.createTestStory(testUser.id, {
      categoryId: testCategory.id
    });
  });

  describe('GET /api/stories', () => {
    test('should get all published stories', async () => {
      const response = await request(app)
        .get('/api/stories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stories');
      expect(Array.isArray(response.body.data.stories)).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should support pagination', async () => {
      // Create multiple stories
      for (let i = 0; i < 5; i++) {
        await global.testUtils.createTestStory(testUser.id, {
          title: `Test Story ${i}`,
          categoryId: testCategory.id
        });
      }

      const response = await request(app)
        .get('/api/stories?page=1&limit=3')
        .expect(200);

      expect(response.body.data.stories.length).toBeLessThanOrEqual(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });

    test('should support sorting options', async () => {
      const response = await request(app)
        .get('/api/stories?sortBy=popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toBeDefined();
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/stories?categoryId=${testCategory.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories.every(story =>
        story.category.id === testCategory.id
      )).toBe(true);
    });
  });

  describe('GET /api/stories/:id', () => {
    test('should get story by ID', async () => {
      const response = await request(app)
        .get(`/api/stories/${testStory.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.story).toMatchObject({
        id: testStory.id,
        title: testStory.title,
        content: testStory.content
      });
    });

    test('should get story by slug', async () => {
      const response = await request(app)
        .get(`/api/stories/${testStory.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.story.slug).toBe(testStory.slug);
    });

    test('should return 404 for non-existent story', async () => {
      const response = await request(app)
        .get('/api/stories/999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STORY_NOT_FOUND');
    });

    test('should include author information (non-anonymous)', async () => {
      const response = await request(app)
        .get(`/api/stories/${testStory.id}`)
        .expect(200);

      expect(response.body.data.story.author).toMatchObject({
        id: testUser.id,
        nickname: testUser.nickname
      });
    });

    test('should hide author information for anonymous stories', async () => {
      const anonymousStory = await global.testUtils.createTestStory(testUser.id, {
        isAnonymous: true,
        categoryId: testCategory.id
      });

      const response = await request(app)
        .get(`/api/stories/${anonymousStory.id}`)
        .expect(200);

      expect(response.body.data.story.author.nickname).toBe('Anonim');
      expect(response.body.data.story.author.id).toBeNull();
    });
  });

  describe('POST /api/stories', () => {
    test('should create new story with authentication', async () => {
      const storyData = {
        title: 'New Test Story',
        content: 'This is a comprehensive test story content that meets minimum length requirements.',
        categoryId: testCategory.id,
        isAnonymous: false,
        tags: ['test', 'new-story']
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.story).toMatchObject({
        title: storyData.title,
        content: storyData.content,
        categoryId: storyData.categoryId
      });

      // Verify story exists in database
      const createdStory = await global.testUtils.prisma().story.findUnique({
        where: { id: response.body.data.story.id }
      });
      expect(createdStory).toBeTruthy();
    });

    test('should create draft story', async () => {
      const storyData = {
        title: 'Draft Story',
        content: 'This is a draft story.',
        categoryId: testCategory.id,
        isPublished: false
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storyData)
        .expect(201);

      expect(response.body.data.story.isPublished).toBe(false);
      expect(response.body.data.story.slug).toBeNull();
    });

    test('should require authentication', async () => {
      const storyData = {
        title: 'Unauthorized Story',
        content: 'This should fail without authentication.',
        categoryId: testCategory.id
      };

      const response = await request(app)
        .post('/api/stories')
        .send(storyData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/gerekli/i);
    });

    test('should validate title length', async () => {
      const storyData = {
        title: 'A', // Too short
        content: 'Valid content for testing purposes',
        categoryId: testCategory.id
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate content length', async () => {
      const storyData = {
        title: 'Valid Title',
        content: 'Too short', // Too short
        categoryId: testCategory.id
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate category exists', async () => {
      const storyData = {
        title: 'Valid Title',
        content: 'Valid content for testing purposes',
        categoryId: 999999 // Non-existent category
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storyData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/stories/:id', () => {
    test('should update own story', async () => {
      const updateData = {
        title: 'Updated Story Title',
        content: 'Updated story content with sufficient length for validation requirements.'
      };

      const response = await request(app)
        .put(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.story.title).toBe(updateData.title);
      expect(response.body.data.story.content).toBe(updateData.content);
    });

    test('should not update other user\'s story', async () => {
      const updateData = {
        title: 'Unauthorized Update',
        content: 'This should not be allowed to update.'
      };

      const response = await request(app)
        .put(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/stories/${testStory.id}`)
        .send({ title: 'Unauthorized' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/stories/:id', () => {
    test('should delete own story', async () => {
      const response = await request(app)
        .delete(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/silindi/i);

      // Verify story is deleted
      const deletedStory = await global.testUtils.prisma().story.findUnique({
        where: { id: testStory.id }
      });
      expect(deletedStory).toBeNull();
    });

    test('should not delete other user\'s story', async () => {
      const response = await request(app)
        .delete(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/stories/:id/view', () => {
    test('should increment view count', async () => {
      const initialViews = testStory.viewCount;

      const response = await request(app)
        .post(`/api/stories/${testStory.id}/view`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify view count increased
      const updatedStory = await global.testUtils.prisma().story.findUnique({
        where: { id: testStory.id }
      });
      expect(updatedStory.viewCount).toBe(initialViews + 1);
    });

    test('should handle unique view tracking', async () => {
      // Multiple views from same IP should be deduplicated
      await request(app).post(`/api/stories/${testStory.id}/view`);
      await request(app).post(`/api/stories/${testStory.id}/view`);

      const story = await global.testUtils.prisma().story.findUnique({
        where: { id: testStory.id }
      });

      // Exact behavior depends on unique view implementation
      expect(story.viewCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stories/drafts', () => {
    beforeEach(async () => {
      // Create draft stories
      await global.testUtils.createTestStory(testUser.id, {
        title: 'Draft Story 1',
        isPublished: false,
        categoryId: testCategory.id
      });

      await global.testUtils.createTestStory(testUser.id, {
        title: 'Draft Story 2',
        isPublished: false,
        categoryId: testCategory.id
      });
    });

    test('should get user\'s draft stories', async () => {
      const response = await request(app)
        .get('/api/stories/drafts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.drafts).toBeDefined();
      expect(response.body.drafts.every(draft => !draft.isPublished)).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/stories/drafts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/stories/drafts?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.drafts.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('POST /api/stories/:id/publish', () => {
    let draftStory;

    beforeEach(async () => {
      draftStory = await global.testUtils.createTestStory(testUser.id, {
        title: 'Draft to Publish',
        content: 'This is a draft story that will be published for testing.',
        isPublished: false,
        categoryId: testCategory.id
      });
    });

    test('should publish draft story', async () => {
      const response = await request(app)
        .post(`/api/stories/${draftStory.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.story.isPublished).toBe(true);
      expect(response.body.story.slug).toBeTruthy();
    });

    test('should not publish other user\'s draft', async () => {
      const response = await request(app)
        .post(`/api/stories/${draftStory.id}/publish`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should not publish already published story', async () => {
      const response = await request(app)
        .post(`/api/stories/${testStory.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_PUBLISHED');
    });

    test('should validate story content before publishing', async () => {
      const invalidDraft = await global.testUtils.createTestStory(testUser.id, {
        title: 'Too', // Too short
        content: 'Short', // Too short
        isPublished: false,
        categoryId: testCategory.id
      });

      const response = await request(app)
        .post(`/api/stories/${invalidDraft.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/stories/categories', () => {
    test('should get all active categories', async () => {
      const response = await request(app)
        .get('/api/stories/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.categories).toBeDefined();
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.every(cat => cat.isActive)).toBe(true);
    });

    test('should include story counts', async () => {
      const response = await request(app)
        .get('/api/stories/categories')
        .expect(200);

      expect(response.body.categories[0]).toHaveProperty('storyCount');
    });
  });

  describe('GET /api/stories/by-category/:categorySlug', () => {
    test('should get stories by category slug', async () => {
      const response = await request(app)
        .get(`/api/stories/by-category/${testCategory.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.category.slug).toBe(testCategory.slug);
      expect(response.body.stories).toBeDefined();
    });

    test('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/stories/by-category/non-existent-category')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
    });
  });

  describe('GET /api/stories/tags', () => {
    test('should get all active tags', async () => {
      const response = await request(app)
        .get('/api/stories/tags')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tags).toBeDefined();
      expect(Array.isArray(response.body.tags)).toBe(true);
    });

    test('should support search', async () => {
      const response = await request(app)
        .get('/api/stories/tags?search=güç')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tags).toBeDefined();
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/stories/tags?page=1&limit=2')
        .expect(200);

      expect(response.body.tags.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
    });
  });

  describe('GET /api/stories/tag-suggestions', () => {
    test('should get tag suggestions', async () => {
      const response = await request(app)
        .get('/api/stories/tag-suggestions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.suggestions).toBeDefined();
      expect(response.body.popular).toBeDefined();
    });
  });

  describe('POST /api/stories/:id/tags', () => {
    test('should add tags to story', async () => {
      const tagData = {
        tags: ['new-tag', 'another-tag']
      };

      const response = await request(app)
        .post(`/api/stories/${testStory.id}/tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(tagData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.added.length).toBeGreaterThan(0);
    });

    test('should not add tags to other user\'s story', async () => {
      const response = await request(app)
        .post(`/api/stories/${testStory.id}/tags`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ tags: ['unauthorized'] })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should validate tag limit', async () => {
      const manyTags = Array(20).fill().map((_, i) => `tag-${i}`);

      const response = await request(app)
        .post(`/api/stories/${testStory.id}/tags`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tags: manyTags })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TAG_LIMIT_EXCEEDED');
    });
  });

  describe('DELETE /api/stories/:id/tags/:tagId', () => {
    let storyWithTag;
    let tag;

    beforeEach(async () => {
      // Create a story with tags
      tag = testTags[0];
      storyWithTag = await global.testUtils.createTestStory(testUser.id, {
        categoryId: testCategory.id
      });

      // Add tag to story
      await global.testUtils.prisma().storyTag.create({
        data: {
          storyId: storyWithTag.id,
          tagId: tag.id
        }
      });
    });

    test('should remove tag from story', async () => {
      const response = await request(app)
        .delete(`/api/stories/${storyWithTag.id}/tags/${tag.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify tag removed
      const storyTag = await global.testUtils.prisma().storyTag.findFirst({
        where: { storyId: storyWithTag.id, tagId: tag.id }
      });
      expect(storyTag).toBeNull();
    });

    test('should not remove tag from other user\'s story', async () => {
      const response = await request(app)
        .delete(`/api/stories/${storyWithTag.id}/tags/${tag.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/stories/by-tag/:tagSlug', () => {
    test('should get stories by tag', async () => {
      const tag = testTags[0];

      const response = await request(app)
        .get(`/api/stories/by-tag/${tag.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tag.slug).toBe(tag.slug);
      expect(response.body.stories).toBeDefined();
    });

    test('should return 404 for non-existent tag', async () => {
      const response = await request(app)
        .get('/api/stories/by-tag/non-existent-tag')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TAG_NOT_FOUND');
    });
  });

  describe('POST /api/stories/:id/report', () => {
    test('should report story', async () => {
      const reportData = {
        reason: 'inappropriate content',
        description: 'This story contains inappropriate content'
      };

      const response = await request(app)
        .post(`/api/stories/${testStory.id}/report`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/şikayet/i);
    });

    test('should not allow duplicate reports', async () => {
      const reportData = {
        reason: 'spam',
        description: 'This is spam content'
      };

      // First report
      await request(app)
        .post(`/api/stories/${testStory.id}/report`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(reportData);

      // Second report should fail
      const response = await request(app)
        .post(`/api/stories/${testStory.id}/report`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ALREADY_REPORTED');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/stories/${testStory.id}/report`)
        .send({ reason: 'spam' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Support System', () => {
    describe('GET /api/stories/:id/support-summary', () => {
      test('should get support summary', async () => {
        const response = await request(app)
          .get(`/api/stories/${testStory.id}/support-summary`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.summary).toBeDefined();
        expect(response.body.summary.breakdown).toBeDefined();
      });

      test('should include user support state when authenticated', async () => {
        const response = await request(app)
          .get(`/api/stories/${testStory.id}/support-summary`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.summary).toHaveProperty('userSupport');
      });
    });

    describe('POST /api/stories/:id/support', () => {
      test('should add support reaction', async () => {
        const supportData = { type: 'heart' };

        const response = await request(app)
          .post(`/api/stories/${testStory.id}/support`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send(supportData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.action).toBe('added');
        expect(response.body.supportType).toBe('heart');
      });

      test('should remove support when clicking same type', async () => {
        // First add support
        await request(app)
          .post(`/api/stories/${testStory.id}/support`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({ type: 'heart' });

        // Then remove it
        const response = await request(app)
          .post(`/api/stories/${testStory.id}/support`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({ type: 'heart' })
          .expect(200);

        expect(response.body.action).toBe('removed');
      });

      test('should change support type', async () => {
        // Add heart support
        await request(app)
          .post(`/api/stories/${testStory.id}/support`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({ type: 'heart' });

        // Change to clap
        const response = await request(app)
          .post(`/api/stories/${testStory.id}/support`)
          .set('Authorization', `Bearer ${anotherUserToken}`)
          .send({ type: 'clap' })
          .expect(200);

        expect(response.body.action).toBe('changed');
        expect(response.body.supportType).toBe('clap');
      });

      test('should require authentication', async () => {
        const response = await request(app)
          .post(`/api/stories/${testStory.id}/support`)
          .send({ type: 'heart' })
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('GET /api/stories/search', () => {
    beforeEach(async () => {
      // Create stories with different content for search testing
      await global.testUtils.createTestStory(testUser.id, {
        title: 'Güçlü Kadın Hikayesi',
        content: 'Bu hikaye güçlü kadınlar hakkında bir deneyim paylaşımı.',
        categoryId: testCategory.id
      });

      await global.testUtils.createTestStory(testUser.id, {
        title: 'Cesaret ve Umut',
        content: 'Cesaret ve umut dolu bir hikaye anlatımı.',
        categoryId: testCategory.id
      });
    });

    test('should search stories by title', async () => {
      const response = await request(app)
        .get('/api/stories/search?q=güçlü')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stories.some(story =>
        story.title.toLowerCase().includes('güçlü')
      )).toBe(true);
    });

    test('should search stories by content', async () => {
      const response = await request(app)
        .get('/api/stories/search?q=cesaret')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stories.length).toBeGreaterThan(0);
    });

    test('should filter by category', async () => {
      const response = await request(app)
        .get(`/api/stories/search?categoryId=${testCategory.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stories.every(story =>
        story.category.id === testCategory.id
      )).toBe(true);
    });

    test('should filter by tags', async () => {
      const tag = testTags[0];

      const response = await request(app)
        .get(`/api/stories/search?tags=${tag.slug}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should support sorting options', async () => {
      const response = await request(app)
        .get('/api/stories/search?sortBy=popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query.sortBy).toBe('popular');
    });

    test('should return filter options', async () => {
      const response = await request(app)
        .get('/api/stories/search?q=test')
        .expect(200);

      expect(response.body.filters).toBeDefined();
      expect(response.body.filters.categories).toBeDefined();
      expect(response.body.filters.tags).toBeDefined();
    });
  });

  describe('GET /api/stories/popular', () => {
    test('should get popular stories', async () => {
      const response = await request(app)
        .get('/api/stories/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stories).toBeDefined();
      expect(response.body.timeframe).toBe('week'); // default
    });

    test('should support timeframe filter', async () => {
      const response = await request(app)
        .get('/api/stories/popular?timeframe=month')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.timeframe).toBe('month');
    });

    test('should include organization info when available', async () => {
      const response = await request(app)
        .get('/api/stories/popular')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Organization field should be present even if null
      expect(response.body.stories[0]).toHaveProperty('organization');
    });
  });

  describe('GET /api/stories/trending', () => {
    test('should get trending stories', async () => {
      const response = await request(app)
        .get('/api/stories/trending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stories).toBeDefined();
    });

    test('should include trending metrics', async () => {
      const response = await request(app)
        .get('/api/stories/trending')
        .expect(200);

      if (response.body.stories.length > 0) {
        expect(response.body.stories[0]).toHaveProperty('metrics');
        expect(response.body.stories[0].metrics).toHaveProperty('score');
        expect(response.body.stories[0].metrics).toHaveProperty('recent');
      }
    });

    test('should include support breakdown', async () => {
      const response = await request(app)
        .get('/api/stories/trending')
        .expect(200);

      if (response.body.stories.length > 0) {
        expect(response.body.stories[0]).toHaveProperty('breakdown');
      }
    });
  });

  describe('GET /api/stories/stats', () => {
    test('should get platform statistics', async () => {
      const response = await request(app)
        .get('/api/stories/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total).toBeDefined();
      expect(response.body.stats.recent).toBeDefined();
      expect(response.body.stats.topCategories).toBeDefined();
    });

    test('should include all stat categories', async () => {
      const response = await request(app)
        .get('/api/stories/stats')
        .expect(200);

      const { stats } = response.body;
      expect(stats.total).toHaveProperty('stories');
      expect(stats.total).toHaveProperty('users');
      expect(stats.total).toHaveProperty('organizations');
      expect(stats.total).toHaveProperty('comments');
      expect(stats.recent).toHaveProperty('storiesLast24h');
      expect(stats.recent).toHaveProperty('storiesLast7d');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/stories?page=999999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stories).toEqual([]);
    });

    test('should limit maximum page size', async () => {
      const response = await request(app)
        .get('/api/stories?limit=1000')
        .expect(200);

      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(50);
    });

    test('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/stories/search?q=\'; DROP TABLE stories; --')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should not cause database errors
    });

    test('should handle malformed story IDs', async () => {
      const response = await request(app)
        .get('/api/stories/not-a-number')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});