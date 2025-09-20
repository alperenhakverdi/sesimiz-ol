import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All comment routes require authentication
router.use(authenticateToken);

// Comment rate limiting middleware
const commentRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting
  if (!global.commentRateLimit) {
    global.commentRateLimit = new Map();
  }

  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const userRequests = global.commentRateLimit.get(userId) || [];
  const validRequests = userRequests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: { message: 'Çok fazla yorum gönderiyorsunuz. Lütfen bekleyin.' }
    });
  }

  validRequests.push(now);
  global.commentRateLimit.set(userId, validRequests);
  next();
};

// Get comments for a story
router.get('/story/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    const { sort = 'newest' } = req.query;

    let orderBy;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'popular':
        orderBy = { _count: { reactions: 'desc' } };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get top-level comments (no parent)
    const comments = await prisma.comment.findMany({
      where: {
        storyId: parseInt(storyId),
        parentId: null
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        reactions: {
          select: {
            userId: true,
            reactionType: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            },
            reactions: {
              select: {
                userId: true,
                reactionType: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            reactions: true
          }
        }
      },
      orderBy
    });

    // Transform comments to include reaction data
    const transformedComments = comments.map(comment => ({
      ...comment,
      authorNickname: comment.author.nickname,
      authorAvatar: comment.author.avatar,
      reactionCount: comment._count.reactions,
      userReacted: comment.reactions.some(r => r.userId === req.user.id),
      replies: comment.replies.map(reply => ({
        ...reply,
        authorNickname: reply.author.nickname,
        authorAvatar: reply.author.avatar,
        reactionCount: reply.reactions.length,
        userReacted: reply.reactions.some(r => r.userId === req.user.id)
      }))
    }));

    res.json({
      success: true,
      comments: transformedComments
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Yorumlar getirilemedi.' }
    });
  }
});

// Create new comment
router.post('/', commentRateLimit, async (req, res) => {
  try {
    const { content, storyId, parentId } = req.body;
    const authorId = req.user.id;

    // Validation
    if (!content || !storyId) {
      return res.status(400).json({
        success: false,
        error: { message: 'İçerik ve hikaye ID gerekli.' }
      });
    }

    if (content.length < 1 || content.length > 500) {
      return res.status(400).json({
        success: false,
        error: { message: 'Yorum 1-500 karakter arasında olmalı.' }
      });
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: parseInt(storyId) }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: { message: 'Hikaye bulunamadı.' }
      });
    }

    // Check if parent comment exists (for replies)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId) }
      });

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          error: { message: 'Ana yorum bulunamadı.' }
        });
      }

      if (parentComment.parentId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Sadece ana yorumlara yanıt verebilirsiniz.' }
        });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        storyId: parseInt(storyId),
        authorId,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      comment: {
        ...comment,
        authorNickname: comment.author.nickname,
        authorAvatar: comment.author.avatar,
        reactionCount: 0,
        userReacted: false
      }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Yorum oluşturulamadı.' }
    });
  }
});

// React to comment
router.post('/:commentId/react', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;
    const reactionType = 'heart'; // Simple heart reaction only

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Yorum bulunamadı.' }
      });
    }

    // Check if user already reacted
    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId: parseInt(commentId)
        }
      }
    });

    if (existingReaction) {
      // Remove reaction
      await prisma.commentReaction.delete({
        where: {
          userId_commentId: {
            userId,
            commentId: parseInt(commentId)
          }
        }
      });

      res.json({
        success: true,
        action: 'removed',
        message: 'Tepki kaldırıldı.'
      });
    } else {
      // Add reaction
      await prisma.commentReaction.create({
        data: {
          userId,
          commentId: parseInt(commentId),
          reactionType
        }
      });

      res.json({
        success: true,
        action: 'added',
        message: 'Tepki eklendi.'
      });
    }

  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Tepki verilemedi.' }
    });
  }
});

// Delete comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check if comment exists and user is owner
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Yorum bulunamadı.' }
      });
    }

    if (comment.authorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Bu yorumu silme yetkiniz yok.' }
      });
    }

    // Delete comment and its reactions
    await prisma.commentReaction.deleteMany({
      where: { commentId: parseInt(commentId) }
    });

    // Delete replies first
    await prisma.comment.deleteMany({
      where: { parentId: parseInt(commentId) }
    });

    // Delete the comment
    await prisma.comment.delete({
      where: { id: parseInt(commentId) }
    });

    res.json({
      success: true,
      message: 'Yorum silindi.'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Yorum silinemedi.' }
    });
  }
});

// Report comment
router.post('/:commentId/report', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Şikayet nedeni gerekli.' }
      });
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(commentId) }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Yorum bulunamadı.' }
      });
    }

    // Mark comment as reported
    await prisma.comment.update({
      where: { id: parseInt(commentId) },
      data: { reportedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Yorum şikayet edildi.'
    });

  } catch (error) {
    console.error('Report comment error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Yorum şikayet edilemedi.' }
    });
  }
});

export default router;