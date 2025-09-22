import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/stats/organizations - Get organization statistics
router.get('/organizations', async (req, res) => {
  try {
    const [
      totalOrganizations,
      activeOrganizations,
      verifiedOrganizations,
      totalMembers,
      totalFollowers,
      recentOrganizations
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.organization.count({ where: { isVerified: true } }),
      prisma.organizationMember.count(),
      prisma.stkFollow.count(),
      prisma.organization.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        total: totalOrganizations,
        active: activeOrganizations,
        verified: verifiedOrganizations,
        members: totalMembers,
        followers: totalFollowers,
        recentlyCreated: recentOrganizations
      }
    });
  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'STK istatistikleri getirilemedi'
      }
    });
  }
});

// GET /api/stats/community - Get community statistics
router.get('/community', async (req, res) => {
  try {
    const [
      totalStories,
      totalComments,
      totalUsers,
      totalOrganizations,
      recentUsers,
      recentStories
    ] = await Promise.all([
      prisma.story.count(),
      prisma.comment.count(),
      prisma.user.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.story.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        stories: {
          total: totalStories,
          recent: recentStories
        },
        users: {
          total: totalUsers,
          recent: recentUsers
        },
        organizations: {
          total: totalOrganizations
        },
        comments: {
          total: totalComments
        }
      }
    });
  } catch (error) {
    console.error('Get community stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Topluluk istatistikleri getirilemedi'
      }
    });
  }
});

export default router;