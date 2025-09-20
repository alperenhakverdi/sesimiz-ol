import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getAllStories,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
  incrementViewCount
} from '../controllers/storyFirebaseController.js';
import { authenticateToken } from '../middleware/auth.js';
import { csrfMiddleware } from '../utils/csrf.js';

const prisma = new PrismaClient();

const router = express.Router();

// GET /api/stories - List all stories (public)
router.get('/', getAllStories);

// GET /api/stories/:id - Get story details
router.get('/:id', getStoryById);

// POST /api/stories/:id/view - Increment view count
router.post('/:id/view', incrementViewCount);

// POST /api/stories - Create new story (requires authentication)
router.post('/', authenticateToken, csrfMiddleware, createStory);

// PUT /api/stories/:id - Update story (author only)
router.put('/:id', authenticateToken, csrfMiddleware, updateStory);

// DELETE /api/stories/:id - Delete story (author only)
router.delete('/:id', authenticateToken, csrfMiddleware, deleteStory);

// POST /api/stories/:id/report - Report story
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Şikayet sebebi gereklidir'
        }
      });
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: { id: true }
        }
      }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORY_NOT_FOUND',
          message: 'Hikaye bulunamadı'
        }
      });
    }

    // Check if user already reported this story
    const existingReport = await prisma.storyReport.findFirst({
      where: {
        reporterId: userId,
        storyId: storyId
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_REPORTED',
          message: 'Bu hikayeyi zaten şikayet ettiniz'
        }
      });
    }

    // Create report
    await prisma.storyReport.create({
      data: {
        reporterId: userId,
        storyId: storyId,
        reason,
        description: description || null
      }
    });

    res.json({
      success: true,
      message: 'Şikayetiniz başarıyla gönderildi'
    });

  } catch (error) {
    console.error('Report story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Şikayet gönderilirken bir hata oluştu'
      }
    });
  }
});

export default router;
