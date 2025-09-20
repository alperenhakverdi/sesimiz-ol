import express from 'express';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get activity feed for authenticated user
router.get('/feed', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    // Get users that the current user follows
    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return res.json({
        success: true,
        activities: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Get recent activities from followed users
    const activities = [];

    // 1. New stories from followed users (last 7 days)
    const recentStories = await prisma.story.findMany({
      where: {
        authorId: { in: followingIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // 2. New comments from followed users (last 3 days)
    const recentComments = await prisma.comment.findMany({
      where: {
        authorId: { in: followingIds },
        createdAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Last 3 days
        }
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        story: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // 3. New followers (last 24 hours)
    const newFollowers = await prisma.userFollow.findMany({
      where: {
        followingId: userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        follower: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Format activities
    recentStories.forEach(story => {
      activities.push({
        id: `story-${story.id}`,
        type: 'new_story',
        createdAt: story.createdAt,
        user: story.author,
        data: {
          story: {
            id: story.id,
            title: story.title,
            slug: story.slug,
            excerpt: story.content.substring(0, 150) + (story.content.length > 150 ? '...' : '')
          }
        }
      });
    });

    recentComments.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'new_comment',
        createdAt: comment.createdAt,
        user: comment.author,
        data: {
          comment: {
            id: comment.id,
            content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
          },
          story: comment.story
        }
      });
    });

    newFollowers.forEach(follow => {
      activities.push({
        id: `follow-${follow.id}`,
        type: 'new_follower',
        createdAt: follow.createdAt,
        user: follow.follower,
        data: {}
      });
    });

    // Sort all activities by creation date and paginate
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    const total = activities.length;

    res.json({
      success: true,
      activities: sortedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Aktivite akışı getirilemedi'
      }
    });
  }
});

// Get user's own activities
router.get('/my-activities', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const activities = [];

    // User's recent stories
    const userStories = await prisma.story.findMany({
      where: { authorId: userId },
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
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // User's recent comments
    const userComments = await prisma.comment.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        story: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Format activities
    userStories.forEach(story => {
      activities.push({
        id: `story-${story.id}`,
        type: 'my_story',
        createdAt: story.createdAt,
        user: story.author,
        data: {
          story: {
            id: story.id,
            title: story.title,
            slug: story.slug,
            excerpt: story.content.substring(0, 150) + (story.content.length > 150 ? '...' : ''),
            commentCount: story._count.comments
          }
        }
      });
    });

    userComments.forEach(comment => {
      activities.push({
        id: `comment-${comment.id}`,
        type: 'my_comment',
        createdAt: comment.createdAt,
        user: comment.author,
        data: {
          comment: {
            id: comment.id,
            content: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
          },
          story: comment.story
        }
      });
    });

    // Sort activities by creation date
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = await prisma.story.count({
      where: { authorId: userId }
    }) + await prisma.comment.count({
      where: { authorId: userId }
    });

    res.json({
      success: true,
      activities: sortedActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get my activities error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Aktiviteleriniz getirilemedi'
      }
    });
  }
});

export default router;