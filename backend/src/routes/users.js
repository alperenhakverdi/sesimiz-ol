import express from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import {
  createUser,
  getUserProfile,
  updateUserProfile,
  getUserStories,
} from '../controllers/userController.js';
import {
  getUserSettings,
  updateUserSettings,
  updateSettingsValidation,
} from '../controllers/userSettingsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { csrfMiddleware } from '../utils/csrf.js';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for follow operations
const followRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 follows per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla takip isteği gönderdiniz. Lütfen 15 dakika bekleyin.'
    }
  }
});

// POST /api/users - Create new user (registration)
router.post('/', createUser);

// GET /api/users/settings - Get authenticated user settings
router.get('/settings', authenticateToken, getUserSettings);

// PUT /api/users/settings - Update authenticated user settings
router.put(
  '/settings',
  authenticateToken,
  csrfMiddleware,
  updateSettingsValidation,
  updateUserSettings
);

// GET /api/users/:id - Get user profile
router.get('/:id', getUserProfile);

// PUT /api/users/:id - Update user profile
router.put('/:id', updateUserProfile);

// GET /api/users/:id/stories - Get user's stories
router.get('/:id/stories', getUserStories);

// Following system routes

// Follow a user
router.post('/:userId/follow', authenticateToken, followRateLimit, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_FOLLOW_SELF',
          message: 'Kendinizi takip edemezsiniz'
        }
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      });
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_FOLLOWING',
          message: 'Bu kullanıcıyı zaten takip ediyorsunuz'
        }
      });
    }

    // Create follow relationship
    await prisma.userFollow.create({
      data: {
        followerId,
        followingId
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı takip edildi'
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip işlemi başarısız'
      }
    });
  }
});

// Unfollow a user
router.delete('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.userId);

    // Check if following exists
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (!existingFollow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_FOLLOWING',
          message: 'Bu kullanıcıyı takip etmiyorsunuz'
        }
      });
    }

    // Remove follow relationship
    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    res.json({
      success: true,
      message: 'Takibi bıraktınız'
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip bırakma işlemi başarısız'
      }
    });
  }
});

// Get user's followers
router.get('/:userId/followers', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const followers = await prisma.userFollow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.userFollow.count({
      where: { followingId: userId }
    });

    res.json({
      success: true,
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takipçiler getirilemedi'
      }
    });
  }
});

// Get user's following
router.get('/:userId/following', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.userFollow.count({
      where: { followerId: userId }
    });

    res.json({
      success: true,
      following: following.map(f => f.following),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip edilenler getirilemedi'
      }
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Arama terimi en az 2 karakter olmalıdır'
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            nickname: {
              contains: q.trim()
            }
          },
          {
            bio: {
              contains: q.trim()
            }
          }
        ]
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            stories: true,
            followers: true
          }
        }
      },
      orderBy: [
        { _count: { followers: 'desc' } },
        { _count: { stories: 'desc' } }
      ],
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          {
            nickname: {
              contains: q.trim()
            }
          },
          {
            bio: {
              contains: q.trim()
            }
          }
        ]
      }
    });

    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        stats: {
          storiesCount: user._count.stories,
          followersCount: user._count.followers
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kullanıcı araması başarısız'
      }
    });
  }
});

export default router;
