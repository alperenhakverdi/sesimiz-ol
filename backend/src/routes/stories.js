import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getAllStories,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
  incrementViewCount
} from '../controllers/storyController.js';
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

// GET /api/stories/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { stories: true }
        }
      }
    });

    res.json({
      success: true,
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        description: category.description,
        storyCount: category._count.stories
      }))
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kategoriler getirilemedi'
      }
    });
  }
});

// GET /api/stories/by-category/:categorySlug - Get stories by category
router.get('/by-category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Find category by slug
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CATEGORY_NOT_FOUND',
          message: 'Kategori bulunamadı'
        }
      });
    }

    // Get stories for this category
    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where: { categoryId: category.id },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              avatar: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.story.count({
        where: { categoryId: category.id }
      })
    ]);

    res.json({
      success: true,
      category,
      stories: stories.map(story => ({
        id: story.id,
        title: story.title,
        content: story.content.substring(0, 200) + (story.content.length > 200 ? '...' : ''),
        slug: story.slug,
        viewCount: story.viewCount,
        createdAt: story.createdAt,
        author: story.author,
        category: story.category,
        commentCount: story._count.comments
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get stories by category error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kategori hikayeleri getirilemedi'
      }
    });
  }
});

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

// GET /api/stories/tags - Get all tags
router.get('/tags', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where: {
          ...where,
          isActive: true
        },
        orderBy: { usageCount: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.tag.count({ where: { ...where, isActive: true } })
    ]);

    res.json({
      success: true,
      tags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Etiketler getirilemedi'
      }
    });
  }
});

// POST /api/stories/:id/tags - Add tags to story
router.post('/:id/tags', authenticateToken, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const { tags } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Etiket listesi gereklidir'
        }
      });
    }

    // Check if story exists and user is the author
    const story = await prisma.story.findUnique({
      where: { id: storyId }
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

    if (story.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bu hikayeye etiket ekleme yetkiniz yok'
        }
      });
    }

    // Create or find tags and add them to story
    const tagPromises = tags.map(async (tagName) => {
      if (!tagName || tagName.trim().length < 2) return null;

      const slug = tagName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-');

      // Find or create tag
      let tag = await prisma.tag.findUnique({
        where: { slug }
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: {
            name: tagName.trim(),
            slug,
            usageCount: 0
          }
        });
      }

      // Check if story-tag relationship already exists
      const existingStoryTag = await prisma.storyTag.findUnique({
        where: {
          storyId_tagId: {
            storyId,
            tagId: tag.id
          }
        }
      });

      if (!existingStoryTag) {
        await prisma.storyTag.create({
          data: {
            storyId,
            tagId: tag.id
          }
        });

        // Increment tag usage count
        await prisma.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: {
              increment: 1
            }
          }
        });
      }

      return tag;
    });

    await Promise.all(tagPromises);

    // Get updated story with tags
    const updatedStory = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Etiketler başarıyla eklendi',
      tags: updatedStory.tags.map(st => st.tag)
    });

  } catch (error) {
    console.error('Add tags to story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Etiketler eklenemedi'
      }
    });
  }
});

// DELETE /api/stories/:id/tags/:tagId - Remove tag from story
router.delete('/:id/tags/:tagId', authenticateToken, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const tagId = parseInt(req.params.tagId);
    const userId = req.user.id;

    // Check if story exists and user is the author
    const story = await prisma.story.findUnique({
      where: { id: storyId }
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

    if (story.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bu hikayeden etiket silme yetkiniz yok'
        }
      });
    }

    // Remove story-tag relationship
    await prisma.storyTag.deleteMany({
      where: {
        storyId,
        tagId
      }
    });

    // Decrement tag usage count
    await prisma.tag.update({
      where: { id: tagId },
      data: {
        usageCount: {
          decrement: 1
        }
      }
    });

    res.json({
      success: true,
      message: 'Etiket başarıyla silindi'
    });

  } catch (error) {
    console.error('Remove tag from story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Etiket silinemedi'
      }
    });
  }
});

// GET /api/stories/by-tag/:tagSlug - Get stories by tag
router.get('/by-tag/:tagSlug', async (req, res) => {
  try {
    const { tagSlug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Find tag by slug
    const tag = await prisma.tag.findUnique({
      where: { slug: tagSlug }
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAG_NOT_FOUND',
          message: 'Etiket bulunamadı'
        }
      });
    }

    // Get stories for this tag
    const [storyTags, total] = await Promise.all([
      prisma.storyTag.findMany({
        where: { tagId: tag.id },
        include: {
          story: {
            include: {
              author: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true
                }
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  color: true
                }
              },
              _count: {
                select: { comments: true }
              }
            }
          }
        },
        orderBy: { story: { createdAt: 'desc' } },
        skip,
        take: limit
      }),
      prisma.storyTag.count({
        where: { tagId: tag.id }
      })
    ]);

    const stories = storyTags.map(st => ({
      id: st.story.id,
      title: st.story.title,
      content: st.story.content.substring(0, 200) + (st.story.content.length > 200 ? '...' : ''),
      slug: st.story.slug,
      viewCount: st.story.viewCount,
      createdAt: st.story.createdAt,
      author: st.story.author,
      category: st.story.category,
      commentCount: st.story._count.comments
    }));

    res.json({
      success: true,
      tag,
      stories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get stories by tag error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Etiket hikayeleri getirilemedi'
      }
    });
  }
});

// GET /api/stories/search - Enhanced search with filters
router.get('/search', async (req, res) => {
  try {
    const {
      q = '',
      categoryId,
      tags,
      page = 1,
      limit = 10,
      sortBy = 'recent' // recent, popular, relevant
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = { AND: [] };

    // Text search
    if (q.trim()) {
      where.AND.push({
        OR: [
          { title: { contains: q.trim(), mode: 'insensitive' } },
          { content: { contains: q.trim(), mode: 'insensitive' } }
        ]
      });
    }

    // Category filter
    if (categoryId) {
      where.AND.push({
        categoryId: parseInt(categoryId)
      });
    }

    // Tag filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      const tagSlugs = tagArray.map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').trim('-'));

      if (tagSlugs.length > 0) {
        where.AND.push({
          tags: {
            some: {
              tag: {
                slug: {
                  in: tagSlugs
                }
              }
            }
          }
        });
      }
    }

    // If no filters, remove the AND array
    if (where.AND.length === 0) {
      delete where.AND;
    }

    // Define sorting
    let orderBy;
    switch (sortBy) {
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'relevant':
        // For relevance, we'll use a combination of view count and recency
        orderBy = [
          { viewCount: 'desc' },
          { createdAt: 'desc' }
        ];
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
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
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              color: true
            }
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.story.count({ where })
    ]);

    // Get available filters for the current search
    const availableCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { stories: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const availableTags = await prisma.tag.findMany({
      where: {
        isActive: true,
        usageCount: { gt: 0 }
      },
      orderBy: { usageCount: 'desc' },
      take: 20 // Top 20 most used tags
    });

    res.json({
      success: true,
      query: {
        text: q,
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        sortBy
      },
      stories: stories.map(story => ({
        id: story.id,
        title: story.title,
        content: story.content.substring(0, 200) + (story.content.length > 200 ? '...' : ''),
        slug: story.slug,
        viewCount: story.viewCount,
        createdAt: story.createdAt,
        author: story.author,
        category: story.category,
        tags: story.tags.map(st => st.tag),
        commentCount: story._count.comments
      })),
      filters: {
        categories: availableCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          storyCount: cat._count.stories
        })),
        tags: availableTags
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Enhanced search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Arama başarısız'
      }
    });
  }
});

export default router;
