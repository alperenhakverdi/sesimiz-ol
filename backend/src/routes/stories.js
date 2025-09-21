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
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { csrfMiddleware } from '../utils/csrf.js';
import { TAG_SUGGESTIONS } from '../config/tagSuggestions.js';
import {
  addTagsToStory,
  slugifyTag,
  TagLimitError
} from '../utils/tagUtils.js';
import {
  buildSupportSummary,
  applySupportMutation,
  SUPPORT_TYPES,
  normalizeSupportType,
  formatSupportSummary,
  SUPPORT_TYPE_LABELS
} from '../utils/supportUtils.js';
import { calculateContentMetrics } from '../utils/contentQuality.js';

const prisma = new PrismaClient();

const router = express.Router();

const TRENDING_WINDOW_HOURS = 72;
const TRENDING_WINDOW_MS = TRENDING_WINDOW_HOURS * 60 * 60 * 1000;

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Helper function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, storyId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.story.findUnique({
      where: { slug }
    });

    if (!existing || (storyId && existing.id === storyId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// GET /api/stories - List all stories (public)
router.get('/', getAllStories);

// GET /api/stories/tag-suggestions - Get predefined tag suggestions (must be before /:id route)
router.get('/tag-suggestions', async (req, res) => {
  try {
    const suggestions = TAG_SUGGESTIONS.map(name => ({
      name,
      slug: slugifyTag(name)
    }));

    // Return only predefined suggestions for now (Tag model doesn't exist in current schema)
    const popular = [];

    res.json({
      success: true,
      suggestions,
      popular
    });
  } catch (error) {
    console.error('Get tag suggestions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Etiket önerileri getirilemedi'
      }
    });
  }
});

// GET /api/stories/:id - Get story details
router.get('/:id', optionalAuth, getStoryById);

// POST /api/stories/:id/view - Increment view count (unique)
router.post('/:id/view', optionalAuth, incrementViewCount);

// POST /api/stories - Create new story (requires authentication)
router.post('/', authenticateToken, csrfMiddleware, createStory);

// GET /api/stories/drafts - Get user's draft stories
router.get('/drafts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [drafts, total] = await Promise.all([
      prisma.story.findMany({
        where: {
          authorId: userId,
          isPublished: false
        },
        include: {
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
              tag: true
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.story.count({
        where: {
          authorId: userId,
          isPublished: false
        }
      })
    ]);

    res.json({
      success: true,
      drafts: drafts.map(draft => {
        const contentMetrics = calculateContentMetrics(draft);
        return {
          id: draft.id,
          title: draft.title,
          content: draft.content.substring(0, 200) + (draft.content.length > 200 ? '...' : ''),
          category: draft.category,
          tags: draft.tags.map(st => st.tag),
          createdAt: draft.createdAt,
          updatedAt: draft.updatedAt,
          commentCount: draft._count.comments,
          quality: {
            readingTime: contentMetrics.readingTime,
            qualityScore: contentMetrics.qualityScore,
            qualityRating: contentMetrics.qualityRating,
            wordCount: contentMetrics.wordCount
          }
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get drafts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Taslaklar getirilemedi'
      }
    });
  }
});

// POST /api/stories/:id/publish - Publish a draft
router.post('/:id/publish', authenticateToken, csrfMiddleware, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const userId = req.user.id;

    // Find the draft story
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
          message: 'Bu işlem için yetkiniz yok'
        }
      });
    }

    if (story.isPublished) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_PUBLISHED',
          message: 'Bu hikaye zaten yayınlanmış'
        }
      });
    }

    // Validate for publishing
    if (story.title.length < 5 || story.title.length > 200) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TITLE',
          message: 'Yayınlamak için başlık 5-200 karakter arasında olmalıdır'
        }
      });
    }

    if (story.content.length < 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT',
          message: 'Yayınlamak için içerik en az 50 karakter olmalıdır'
        }
      });
    }

    // Generate slug for publishing
    const baseSlug = generateSlug(story.title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Update story to published
    const publishedStory = await prisma.story.update({
      where: { id: storyId },
      data: {
        isPublished: true,
        slug
      },
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
            tag: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Hikaye başarıyla yayınlandı',
      story: publishedStory
    });

  } catch (error) {
    console.error('Publish story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye yayınlanamadı'
      }
    });
  }
});

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
      stories: stories.map(story => {
        const contentMetrics = calculateContentMetrics(story);
        return {
          id: story.id,
          title: story.title,
          content: story.content.substring(0, 200) + (story.content.length > 200 ? '...' : ''),
          slug: story.slug,
          viewCount: story.viewCount,
          createdAt: story.createdAt,
          author: story.isAnonymous ? {
            id: null,
            nickname: 'Anonim',
            avatar: null
          } : story.author,
          category: story.category,
          commentCount: story._count.comments,
          quality: {
            readingTime: contentMetrics.readingTime,
            qualityScore: contentMetrics.qualityScore,
            qualityRating: contentMetrics.qualityRating,
            wordCount: contentMetrics.wordCount
          }
        };
      }),
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

// GET /api/stories/tag-suggestions - Get predefined tag suggestions (simplified)
router.get('/tag-suggestions', async (req, res) => {
  try {
    const suggestions = TAG_SUGGESTIONS.map(name => ({
      name,
      slug: slugifyTag(name)
    }));

    // Return only predefined suggestions for now (Tag model doesn't exist in current schema)
    const popular = [];

    res.json({
      success: true,
      suggestions,
      popular
    });

  } catch (error) {
    console.error('Get tag suggestions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Etiket önerileri getirilemedi'
      }
    });
  }
});

// GET /api/stories/:id/support-summary - Support breakdown + user state
router.get('/:id/support-summary', optionalAuth, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    if (!Number.isFinite(storyId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STORY_ID',
          message: 'Geçersiz hikaye ID'
        }
      });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true }
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

    const summary = await buildSupportSummary({
      prisma,
      storyId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      summary: formatSupportSummary(summary)
    });

  } catch (error) {
    console.error('Get support summary error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Destek özeti getirilemedi'
      }
    });
  }
});

// POST /api/stories/:id/support - Add/update/remove support reaction
router.post('/:id/support', authenticateToken, csrfMiddleware, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    if (!Number.isFinite(storyId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STORY_ID',
          message: 'Geçersiz hikaye ID'
        }
      });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true }
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

    const supportType = normalizeSupportType(req.body?.type);

    const mutation = await applySupportMutation({
      prisma,
      storyId,
      userId: req.user.id,
      supportType
    });

    const summary = await buildSupportSummary({
      prisma,
      storyId,
      userId: req.user.id
    });

    res.json({
      success: true,
      action: mutation.action,
      supportType: mutation.supportType,
      summary: formatSupportSummary(summary)
    });

  } catch (error) {
    console.error('Support mutation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Destek işlemi tamamlanamadı'
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

    try {
      const { added, tags: updatedTags } = await addTagsToStory({
        prisma,
        storyId,
        tags
      });

      res.json({
        success: true,
        message: added.length > 0
          ? 'Etiketler başarıyla eklendi'
          : 'Yeni etiket eklenmedi',
        added,
        tags: updatedTags
      });
    } catch (error) {
      if (error instanceof TagLimitError) {
        return res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: `Bir hikayeye en fazla ${error.max} etiket ekleyebilirsiniz`
          }
        });
      }

      throw error;
    }

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

    await prisma.tag.updateMany({
      where: {
        id: tagId,
        usageCount: { lt: 0 }
      },
      data: {
        usageCount: 0
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

// GET /api/stories/popular - Get popular stories
router.get('/popular', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const timeframe = req.query.timeframe || 'week'; // day, week, month, all

    // Calculate date range based on timeframe
    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case 'day':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'week':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'month':
        dateFilter = {
          createdAt: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'all':
      default:
        dateFilter = {};
        break;
    }

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where: dateFilter,
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
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              isVerified: true
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
        orderBy: [
          { viewCount: 'desc' },
          { _count: { comments: 'desc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.story.count({ where: dateFilter })
    ]);

    res.json({
      success: true,
      timeframe,
      stories: stories.map(story => ({
        id: story.id,
        title: story.title,
        content: story.content.substring(0, 200) + (story.content.length > 200 ? '...' : ''),
        slug: story.slug,
        viewCount: story.viewCount,
        createdAt: story.createdAt,
        author: story.author,
        category: story.category,
        organization: story.organization,
        tags: story.tags.map(st => st.tag),
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
    console.error('Get popular stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Popüler hikayeler getirilemedi'
      }
    });
  }
});

// GET /api/stories/trending - Get trending stories (based on recent engagement)
router.get('/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const windowStart = new Date(Date.now() - TRENDING_WINDOW_MS);

    const candidateStories = await prisma.story.findMany({
      where: {
        OR: [
          { createdAt: { gte: windowStart } },
          { comments: { some: { createdAt: { gte: windowStart } } } },
          { supports: { some: { createdAt: { gte: windowStart } } } },
          { views: { some: { createdAt: { gte: windowStart } } } }
        ]
      },
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
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            isVerified: true
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
        supports: {
          where: { createdAt: { gte: windowStart } },
          select: { supportType: true }
        },
        views: {
          where: { createdAt: { gte: windowStart } },
          select: { id: true }
        },
        comments: {
          where: { createdAt: { gte: windowStart } },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = candidateStories.map(story => {
      const recentViews = story.views.length;
      const recentSupports = story.supports.length;
      const recentComments = story.comments.length;

      const supportBreakdown = SUPPORT_TYPES.map(type => ({
        type,
        count: story.supports.filter(item => item.supportType === type).length,
        label: SUPPORT_TYPE_LABELS[type] || type
      }));

      const score = (recentViews * 1.5) + (recentSupports * 2) + (recentComments * 1.25) + (story.supportCount * 0.5);

      return {
        story,
        recentViews,
        recentSupports,
        recentComments,
        score,
        supportBreakdown
      };
    }).sort((a, b) => b.score - a.score);

    const total = scored.length;
    const paginated = scored.slice(skip, skip + limit);

    res.json({
      success: true,
      stories: paginated.map(entry => {
        const contentMetrics = calculateContentMetrics(entry.story);
        return {
          id: entry.story.id,
          title: entry.story.title,
          content: entry.story.content.substring(0, 200) + (entry.story.content.length > 200 ? '...' : ''),
          slug: entry.story.slug,
          viewCount: entry.story.viewCount,
          supportCount: entry.story.supportCount,
          createdAt: entry.story.createdAt,
          author: entry.story.isAnonymous ? {
            id: null,
            nickname: 'Anonim',
            avatar: null
          } : entry.story.author,
          category: entry.story.category,
          organization: entry.story.organization,
          tags: entry.story.tags.map(st => st.tag),
          quality: {
            readingTime: contentMetrics.readingTime,
            qualityScore: contentMetrics.qualityScore,
            qualityRating: contentMetrics.qualityRating,
            wordCount: contentMetrics.wordCount
          },
          metrics: {
            score: entry.score,
            recent: {
              uniqueViews: entry.recentViews,
              supports: entry.recentSupports,
              comments: entry.recentComments
            }
          },
          breakdown: entry.supportBreakdown
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get trending stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Trend hikayeler getirilemedi'
      }
    });
  }
});

// GET /api/stories/stats - Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalStories,
      totalUsers,
      totalOrganizations,
      totalComments,
      todayStories,
      weekStories,
      popularCategories
    ] = await Promise.all([
      prisma.story.count(),
      prisma.user.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.comment.count(),
      prisma.story.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.story.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.category.findMany({
        include: {
          _count: {
            select: { stories: true }
          }
        },
        orderBy: {
          _count: { stories: 'desc' }
        },
        take: 5
      })
    ]);

    res.json({
      success: true,
      stats: {
        total: {
          stories: totalStories,
          users: totalUsers,
          organizations: totalOrganizations,
          comments: totalComments
        },
        recent: {
          storiesLast24h: todayStories,
          storiesLast7d: weekStories
        },
        topCategories: popularCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          storyCount: cat._count.stories
        }))
      }
    });

  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Platform istatistikleri getirilemedi'
      }
    });
  }
});

export default router;