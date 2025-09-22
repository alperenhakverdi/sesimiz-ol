import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { NotificationHelpers } from '../services/notificationService.js';

const prisma = new PrismaClient();

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Geçersiz veri',
        details: errors.array()
      }
    });
    return true;
  }
  return false;
};

// GET /api/admin/stories - List stories for admin moderation
export const listAdminStories = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const status = req.query.status;
    const search = req.query.search || '';

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
              { author: { nickname: { contains: search, mode: 'insensitive' } } }
            ]
          }
        : {})
    };

    const [total, stories] = await Promise.all([
      prisma.story.count({ where }),
      prisma.story.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          _count: {
            select: {
              comments: true,
              bookmarks: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('List admin stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikayeler yüklenemedi'
      }
    });
  }
};

// POST /api/admin/stories/:id/approve - Approve a story
export const approveStory = async (req, res) => {
  try {
    const storyId = Number(req.params.id);

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            nickname: true
          }
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

    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: req.user.id
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

    // Send notification to story author
    try {
      await NotificationHelpers.storyApproved(story.author.id, story.title);
    } catch (notificationError) {
      console.error('Failed to send story approval notification:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.json({
      success: true,
      data: { story: updatedStory },
      message: 'Hikaye başarıyla onaylandı'
    });
  } catch (error) {
    console.error('Approve story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye onaylanamadı'
      }
    });
  }
};

// POST /api/admin/stories/:id/reject - Reject a story
export const rejectStory = async (req, res) => {
  try {
    const storyId = Number(req.params.id);
    const { reason } = req.body;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            nickname: true
          }
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

    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: req.user.id,
        rejectionReason: reason
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

    // Send notification to story author
    try {
      await NotificationHelpers.storyRejected(story.author.id, story.title, reason);
    } catch (notificationError) {
      console.error('Failed to send story rejection notification:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.json({
      success: true,
      data: { story: updatedStory },
      message: 'Hikaye başarıyla reddedildi'
    });
  } catch (error) {
    console.error('Reject story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye reddedilemedi'
      }
    });
  }
};

// DELETE /api/admin/stories/:id - Delete a story
export const deleteStory = async (req, res) => {
  try {
    const storyId = Number(req.params.id);

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            nickname: true
          }
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

    // Delete related data first
    await prisma.comment.deleteMany({
      where: { storyId }
    });

    await prisma.bookmark.deleteMany({
      where: { storyId }
    });

    await prisma.story.delete({
      where: { id: storyId }
    });

    res.json({
      success: true,
      message: 'Hikaye başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye silinemedi'
      }
    });
  }
};
