import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All bookmark routes require authentication
router.use(authenticateToken);

// POST /api/bookmarks/:storyId - Add story to bookmarks
router.post('/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);
    const userId = req.user.id;

    // Check if story exists
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

    // Check if already bookmarked
    const existingBookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_BOOKMARKED',
          message: 'Bu hikaye zaten yer imlerinizde'
        }
      });
    }

    // Create bookmark
    await prisma.userBookmark.create({
      data: {
        userId,
        storyId
      }
    });

    res.json({
      success: true,
      message: 'Hikaye yer imlerine eklendi'
    });

  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Yer imi eklenemedi'
      }
    });
  }
});

// DELETE /api/bookmarks/:storyId - Remove story from bookmarks
router.delete('/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);
    const userId = req.user.id;

    // Check if bookmark exists
    const existingBookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

    if (!existingBookmark) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKMARK_NOT_FOUND',
          message: 'Bu hikaye yer imlerinizde değil'
        }
      });
    }

    // Remove bookmark
    await prisma.userBookmark.delete({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

    res.json({
      success: true,
      message: 'Hikaye yer imlerinden kaldırıldı'
    });

  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Yer imi kaldırılamadı'
      }
    });
  }
});

// GET /api/bookmarks - Get user's bookmarked stories
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.userBookmark.findMany({
        where: { userId },
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
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userBookmark.count({
        where: { userId }
      })
    ]);

    res.json({
      success: true,
      bookmarks: bookmarks.map(bookmark => ({
        id: bookmark.id,
        bookmarkedAt: bookmark.createdAt,
        story: {
          id: bookmark.story.id,
          title: bookmark.story.title,
          content: bookmark.story.content.substring(0, 200) + (bookmark.story.content.length > 200 ? '...' : ''),
          slug: bookmark.story.slug,
          viewCount: bookmark.story.viewCount,
          createdAt: bookmark.story.createdAt,
          author: bookmark.story.author,
          category: bookmark.story.category,
          tags: bookmark.story.tags.map(st => st.tag),
          commentCount: bookmark.story._count.comments
        }
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Yer imleri getirilemedi'
      }
    });
  }
});

// GET /api/bookmarks/check/:storyId - Check if story is bookmarked
router.get('/check/:storyId', async (req, res) => {
  try {
    const storyId = parseInt(req.params.storyId);
    const userId = req.user.id;

    const bookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_storyId: {
          userId,
          storyId
        }
      }
    });

    res.json({
      success: true,
      isBookmarked: !!bookmark,
      bookmarkedAt: bookmark?.createdAt || null
    });

  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Yer imi kontrolü yapılamadı'
      }
    });
  }
});

export default router;