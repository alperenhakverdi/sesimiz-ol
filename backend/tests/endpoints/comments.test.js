/**
 * Comments Endpoints Comprehensive Test Suite
 * Tests all comment-related API endpoints including threading, reactions, and moderation
 */

import request from 'supertest';
import app from '../../src/app.js';

describe('Comments Endpoints', () => {
  let testUser;
  let anotherUser;
  let moderatorUser;
  let authToken;
  let anotherUserToken;
  let moderatorToken;
  let testStory;
  let testComment;

  beforeEach(async () => {
    // Create test users
    testUser = await global.testUtils.createTestUser({
      email: 'commenter@example.com',
      nickname: 'commenter'
    });

    anotherUser = await global.testUtils.createTestUser({
      email: 'reader@example.com',
      nickname: 'reader'
    });

    moderatorUser = await global.testUtils.createTestUser({
      email: 'moderator@example.com',
      nickname: 'moderator',
      role: 'ADMIN'
    });

    authToken = await global.testUtils.generateTestToken(testUser.id);
    anotherUserToken = await global.testUtils.generateTestToken(anotherUser.id);
    moderatorToken = await global.testUtils.generateTestToken(moderatorUser.id);

    // Create test story
    testStory = await global.testUtils.createTestStory(testUser.id);

    // Create test comment
    testComment = await global.testUtils.prisma().comment.create({
      data: {
        content: 'This is a test comment for testing purposes.',
        storyId: testStory.id,
        authorId: testUser.id
      }
    });
  });

  describe('GET /api/comments/story/:storyId', () => {
    beforeEach(async () => {
      // Create additional comments for testing
      await global.testUtils.prisma().comment.create({
        data: {
          content: 'Another test comment',
          storyId: testStory.id,
          authorId: anotherUser.id
        }
      });

      // Create a reply
      await global.testUtils.prisma().comment.create({
        data: {
          content: 'This is a reply to the first comment',
          storyId: testStory.id,
          authorId: anotherUser.id,
          parentId: testComment.id
        }
      });
    });

    test('should get comments for a story', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comments).toBeDefined();
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBeGreaterThan(0);
    });

    test('should include author information', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const comment = response.body.comments[0];
      expect(comment).toHaveProperty('authorNickname');
      expect(comment).toHaveProperty('authorAvatar');
      expect(comment.author).toHaveProperty('nickname');
    });

    test('should include replies in hierarchical structure', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const parentComment = response.body.comments.find(c => c.id === testComment.id);
      expect(parentComment.replies).toBeDefined();
      expect(Array.isArray(parentComment.replies)).toBe(true);
      expect(parentComment.replies.length).toBeGreaterThan(0);
    });

    test('should include reaction information', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const comment = response.body.comments[0];
      expect(comment).toHaveProperty('reactionCount');
      expect(comment).toHaveProperty('userReacted');
    });

    test('should support sorting options', async () => {
      // Test newest sort (default)
      const newestResponse = await request(app)
        .get(`/api/comments/story/${testStory.id}?sort=newest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(newestResponse.body.success).toBe(true);

      // Test oldest sort
      const oldestResponse = await request(app)
        .get(`/api/comments/story/${testStory.id}?sort=oldest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(oldestResponse.body.success).toBe(true);

      // Test popular sort
      const popularResponse = await request(app)
        .get(`/api/comments/story/${testStory.id}?sort=popular`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(popularResponse.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return empty array for story with no comments', async () => {
      const emptyStory = await global.testUtils.createTestStory(anotherUser.id);

      const response = await request(app)
        .get(`/api/comments/story/${emptyStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comments).toEqual([]);
    });
  });

  describe('POST /api/comments', () => {
    test('should create new comment', async () => {
      const commentData = {
        content: 'This is a new comment for testing',
        storyId: testStory.id
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comment).toBeDefined();
      expect(response.body.comment.content).toBe(commentData.content);
      expect(response.body.comment.storyId).toBe(commentData.storyId);
      expect(response.body.comment.authorNickname).toBe(testUser.nickname);

      // Verify comment exists in database
      const createdComment = await global.testUtils.prisma().comment.findUnique({
        where: { id: response.body.comment.id }
      });
      expect(createdComment).toBeTruthy();
    });

    test('should create reply to existing comment', async () => {
      const replyData = {
        content: 'This is a reply to the test comment',
        storyId: testStory.id,
        parentId: testComment.id
      };

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comment.parentId).toBe(testComment.id);
      expect(response.body.comment.content).toBe(replyData.content);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/gerekli/i);
    });

    test('should validate content length', async () => {
      // Test empty content
      const emptyResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
          storyId: testStory.id
        })
        .expect(400);

      expect(emptyResponse.body.success).toBe(false);

      // Test too long content
      const longContent = 'a'.repeat(501);
      const longResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
          storyId: testStory.id
        })
        .expect(400);

      expect(longResponse.body.success).toBe(false);
    });

    test('should validate story exists', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment on non-existent story',
          storyId: 999999
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/hikaye.*bulunamadı/i);
    });

    test('should validate parent comment exists for replies', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply to non-existent comment',
          storyId: testStory.id,
          parentId: 999999
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/ana yorum.*bulunamadı/i);
    });

    test('should not allow replies to replies (nested comments)', async () => {
      // Create a reply first
      const reply = await global.testUtils.prisma().comment.create({
        data: {
          content: 'First level reply',
          storyId: testStory.id,
          authorId: anotherUser.id,
          parentId: testComment.id
        }
      });

      // Try to reply to the reply
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Nested reply (should fail)',
          storyId: testStory.id,
          parentId: reply.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/ana yorumlara yanıt/i);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/comments')
        .send({
          content: 'Unauthorized comment',
          storyId: testStory.id
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should respect rate limiting', async () => {
      const commentData = {
        content: 'Rate limit test comment',
        storyId: testStory.id
      };

      // Send multiple requests rapidly
      const promises = Array(10).fill().map((_, i) =>
        request(app)
          .post('/api/comments')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ ...commentData, content: `${commentData.content} ${i}` })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/comments/:commentId/react', () => {
    test('should add reaction to comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${testComment.id}/react`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.action).toBe('added');
      expect(response.body.message).toMatch(/tepki eklendi/i);

      // Verify reaction exists in database
      const reaction = await global.testUtils.prisma().commentReaction.findUnique({
        where: {
          userId_commentId: {
            userId: testUser.id,
            commentId: testComment.id
          }
        }
      });
      expect(reaction).toBeTruthy();
      expect(reaction.reactionType).toBe('heart');
    });

    test('should remove reaction when reacting again', async () => {
      // Add reaction first
      await global.testUtils.prisma().commentReaction.create({
        data: {
          userId: testUser.id,
          commentId: testComment.id,
          reactionType: 'heart'
        }
      });

      const response = await request(app)
        .post(`/api/comments/${testComment.id}/react`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.action).toBe('removed');
      expect(response.body.message).toMatch(/tepki kaldırıldı/i);

      // Verify reaction removed from database
      const reaction = await global.testUtils.prisma().commentReaction.findUnique({
        where: {
          userId_commentId: {
            userId: testUser.id,
            commentId: testComment.id
          }
        }
      });
      expect(reaction).toBeNull();
    });

    test('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .post('/api/comments/999999/react')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/yorum.*bulunamadı/i);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/comments/${testComment.id}/react`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle multiple users reacting to same comment', async () => {
      // First user reacts
      await request(app)
        .post(`/api/comments/${testComment.id}/react`)
        .set('Authorization', `Bearer ${authToken}`);

      // Second user reacts
      const response = await request(app)
        .post(`/api/comments/${testComment.id}/react`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.action).toBe('added');

      // Verify both reactions exist
      const reactionCount = await global.testUtils.prisma().commentReaction.count({
        where: { commentId: testComment.id }
      });
      expect(reactionCount).toBe(2);
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    test('should delete own comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/yorum silindi/i);

      // Verify comment is deleted
      const deletedComment = await global.testUtils.prisma().comment.findUnique({
        where: { id: testComment.id }
      });
      expect(deletedComment).toBeNull();
    });

    test('should not delete other user\'s comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/yetkiniz yok/i);
    });

    test('should allow admin to delete any comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should delete comment replies when deleting parent', async () => {
      // Create a reply
      const reply = await global.testUtils.prisma().comment.create({
        data: {
          content: 'Reply to be deleted with parent',
          storyId: testStory.id,
          authorId: anotherUser.id,
          parentId: testComment.id
        }
      });

      // Delete parent comment
      await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify reply is also deleted
      const deletedReply = await global.testUtils.prisma().comment.findUnique({
        where: { id: reply.id }
      });
      expect(deletedReply).toBeNull();
    });

    test('should delete comment reactions when deleting comment', async () => {
      // Add reaction
      await global.testUtils.prisma().commentReaction.create({
        data: {
          userId: anotherUser.id,
          commentId: testComment.id,
          reactionType: 'heart'
        }
      });

      // Delete comment
      await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify reactions are deleted
      const reactions = await global.testUtils.prisma().commentReaction.findMany({
        where: { commentId: testComment.id }
      });
      expect(reactions).toEqual([]);
    });

    test('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/yorum.*bulunamadı/i);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/comments/:commentId/report', () => {
    test('should report comment', async () => {
      const reportData = {
        reason: 'inappropriate content',
        description: 'This comment contains inappropriate language'
      };

      const response = await request(app)
        .post(`/api/comments/${testComment.id}/report`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/yorum şikayet edildi/i);

      // Verify comment is marked as reported
      const reportedComment = await global.testUtils.prisma().comment.findUnique({
        where: { id: testComment.id }
      });
      expect(reportedComment.reportedAt).toBeTruthy();
    });

    test('should validate required fields for reporting', async () => {
      const response = await request(app)
        .post(`/api/comments/${testComment.id}/report`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/şikayet nedeni gerekli/i);
    });

    test('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .post('/api/comments/999999/report')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ reason: 'inappropriate' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/yorum.*bulunamadı/i);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/comments/${testComment.id}/report`)
        .send({ reason: 'spam' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should accept optional description', async () => {
      const reportData = {
        reason: 'spam',
        description: 'Detailed explanation of why this is spam'
      };

      const response = await request(app)
        .post(`/api/comments/${testComment.id}/report`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Comment Threading and Hierarchy', () => {
    let parentComment;
    let childComment1;
    let childComment2;

    beforeEach(async () => {
      // Create a parent comment
      parentComment = await global.testUtils.prisma().comment.create({
        data: {
          content: 'Parent comment for threading test',
          storyId: testStory.id,
          authorId: testUser.id
        }
      });

      // Create child comments
      childComment1 = await global.testUtils.prisma().comment.create({
        data: {
          content: 'First child comment',
          storyId: testStory.id,
          authorId: anotherUser.id,
          parentId: parentComment.id
        }
      });

      childComment2 = await global.testUtils.prisma().comment.create({
        data: {
          content: 'Second child comment',
          storyId: testStory.id,
          authorId: testUser.id,
          parentId: parentComment.id
        }
      });
    });

    test('should return comments in proper hierarchical structure', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const parent = response.body.comments.find(c => c.id === parentComment.id);
      expect(parent).toBeTruthy();
      expect(parent.replies).toBeDefined();
      expect(parent.replies.length).toBe(2);

      const replyIds = parent.replies.map(r => r.id);
      expect(replyIds).toContain(childComment1.id);
      expect(replyIds).toContain(childComment2.id);
    });

    test('should order replies chronologically', async () => {
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const parent = response.body.comments.find(c => c.id === parentComment.id);
      const replies = parent.replies;

      // Replies should be ordered by creation time (ascending)
      expect(replies[0].id).toBe(childComment1.id);
      expect(replies[1].id).toBe(childComment2.id);
    });

    test('should include reaction data for replies', async () => {
      // Add reaction to a reply
      await global.testUtils.prisma().commentReaction.create({
        data: {
          userId: testUser.id,
          commentId: childComment1.id,
          reactionType: 'heart'
        }
      });

      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const parent = response.body.comments.find(c => c.id === parentComment.id);
      const replyWithReaction = parent.replies.find(r => r.id === childComment1.id);

      expect(replyWithReaction.reactionCount).toBe(1);
      expect(replyWithReaction.userReacted).toBe(true);
    });
  });

  describe('Comment Performance and Edge Cases', () => {
    test('should handle large number of comments efficiently', async () => {
      // Create many comments
      const commentPromises = Array(50).fill().map((_, i) =>
        global.testUtils.prisma().comment.create({
          data: {
            content: `Performance test comment ${i}`,
            storyId: testStory.id,
            authorId: testUser.id
          }
        })
      );

      await Promise.all(commentPromises);

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/comments/story/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.comments.length).toBeGreaterThan(40);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle malformed comment IDs', async () => {
      const response = await request(app)
        .post('/api/comments/not-a-number/react')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should handle SQL injection attempts', async () => {
      const maliciousContent = "'; DROP TABLE comments; --";

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: maliciousContent,
          storyId: testStory.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Content should be safely stored
      expect(response.body.comment.content).toBe(maliciousContent);
    });

    test('should sanitize HTML content', async () => {
      const htmlContent = '<script>alert("xss")</script>Normal content';

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: htmlContent,
          storyId: testStory.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Script tags should be handled appropriately
      expect(response.body.comment.content).toBeDefined();
    });

    test('should handle unicode content', async () => {
      const unicodeContent = '🙋‍♀️ Bu bir test yorumu! 💪 Güçlü kadınlar için 🌟';

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: unicodeContent,
          storyId: testStory.id
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comment.content).toBe(unicodeContent);
    });

    test('should handle concurrent reactions properly', async () => {
      // Multiple users trying to react simultaneously
      const reactionPromises = Array(5).fill().map(() =>
        request(app)
          .post(`/api/comments/${testComment.id}/react`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(reactionPromises);

      // Only one should add, others should remove or be idempotent
      const addedResponses = responses.filter(r =>
        r.status === 200 && r.body.action === 'added'
      );
      expect(addedResponses.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Comment Validation and Security', () => {
    test('should trim whitespace from content', async () => {
      const contentWithWhitespace = '   This comment has whitespace   ';

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: contentWithWhitespace,
          storyId: testStory.id
        })
        .expect(200);

      expect(response.body.comment.content.trim()).toBe('This comment has whitespace');
    });

    test('should reject comments with only whitespace', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '   ',
          storyId: testStory.id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate story ID format', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Valid comment content',
          storyId: 'not-a-number'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should validate parent ID format', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Valid comment content',
          storyId: testStory.id,
          parentId: 'not-a-number'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});