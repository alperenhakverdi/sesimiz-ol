import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/stories - List all stories (simplified for current schema)
export const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build where clause based on current schema
    const where = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.story.count({ where })
    ]);

    // Format stories for response
    const formattedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      content: story.content,
      author: story.author,
      viewCount: story.viewCount,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt
    }));

    res.json({
      success: true,
      stories: formattedStories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikayeler getirilemedi'
      }
    });
  }
};

// POST /api/stories/:id/view - Increment view count
export const incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update view count
    await prisma.story.update({
      where: { id: parseInt(id) },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      message: 'Görüntülenme sayısı güncellendi'
    });
  } catch (error) {
    console.error('Increment view count error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Görüntülenme sayısı güncellenemedi'
      }
    });
  }
};

// GET /api/stories/:id - Get single story
export const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const story = await prisma.story.findUnique({
      where: { id: parseInt(id) },
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

    if (!story) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hikaye bulunamadı'
        }
      });
    }

    res.json({
      success: true,
      story
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye getirilemedi'
      }
    });
  }
};

// POST /api/stories - Create new story
export const createStory = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Başlık ve içerik gereklidir'
        }
      });
    }

    const story = await prisma.story.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: userId
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

    res.status(201).json({
      success: true,
      story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye oluşturulamadı'
      }
    });
  }
};

// PUT /api/stories/:id - Update story
export const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // Check if story exists and user owns it
    const existingStory = await prisma.story.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hikaye bulunamadı'
        }
      });
    }

    if (existingStory.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Bu hikayeyi güncelleme yetkiniz yok'
        }
      });
    }

    const updatedStory = await prisma.story.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title: title.trim() }),
        ...(content && { content: content.trim() })
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
      story: updatedStory
    });
  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye güncellenemedi'
      }
    });
  }
};

// DELETE /api/stories/:id - Delete story
export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if story exists and user owns it
    const existingStory = await prisma.story.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Hikaye bulunamadı'
        }
      });
    }

    if (existingStory.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Bu hikayeyi silme yetkiniz yok'
        }
      });
    }

    await prisma.story.delete({
      where: { id: parseInt(id) }
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