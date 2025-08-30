import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const createStorySchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(50).max(10000).required(),
  authorId: Joi.number().integer().positive().required()
});

const updateStorySchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  content: Joi.string().min(50).max(10000).optional()
});

// Get all stories (public listing)
export const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.story.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikâyeler alınırken bir hata oluştu'
      }
    });
  }
};

// Get story by ID
export const getStoryById = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    
    if (isNaN(storyId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STORY_ID',
          message: 'Geçersiz hikâye ID'
        }
      });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORY_NOT_FOUND',
          message: 'Hikâye bulunamadı'
        }
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    console.error('Get story by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikâye alınırken bir hata oluştu'
      }
    });
  }
};

// Create new story
export const createStory = async (req, res) => {
  try {
    const { error, value } = createStorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => detail.message)
        }
      });
    }

    const { title, content, authorId } = value;

    // Check if author exists
    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUTHOR_NOT_FOUND',
          message: 'Yazar bulunamadı'
        }
      });
    }

    // Create story
    const story = await prisma.story.create({
      data: { title, content, authorId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: story,
      message: 'Hikâye başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikâye oluşturulurken bir hata oluştu'
      }
    });
  }
};

// Update story (author only)
export const updateStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const authorId = parseInt(req.body.authorId); // In real app, this would come from JWT token
    
    if (isNaN(storyId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STORY_ID',
          message: 'Geçersiz hikâye ID'
        }
      });
    }

    const { error, value } = updateStorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => detail.message)
        }
      });
    }

    // Check if story exists and user is the author
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORY_NOT_FOUND',
          message: 'Hikâye bulunamadı'
        }
      });
    }

    if (existingStory.authorId !== authorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bu hikâyeyi düzenleme yetkiniz yok'
        }
      });
    }

    // Update story
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: value,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
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
      data: updatedStory,
      message: 'Hikâye başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikâye güncellenirken bir hata oluştu'
      }
    });
  }
};

// Delete story (author only)
export const deleteStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const authorId = parseInt(req.body.authorId); // In real app, this would come from JWT token
    
    if (isNaN(storyId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STORY_ID',
          message: 'Geçersiz hikâye ID'
        }
      });
    }

    // Check if story exists and user is the author
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORY_NOT_FOUND',
          message: 'Hikâye bulunamadı'
        }
      });
    }

    if (existingStory.authorId !== authorId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bu hikâyeyi silme yetkiniz yok'
        }
      });
    }

    // Delete story
    await prisma.story.delete({
      where: { id: storyId }
    });

    res.json({
      success: true,
      message: 'Hikâye başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikâye silinirken bir hata oluştu'
      }
    });
  }
};