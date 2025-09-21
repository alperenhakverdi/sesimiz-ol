import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/metrics - Get admin dashboard metrics
export const getMetrics = async (req, res) => {
  try {
    // Get current date for today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get user metrics
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });

    const todayUsers = await prisma.user.count({
      where: {
        isActive: true,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const activeUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Get story metrics
    const totalStories = await prisma.story.count();

    const todayStories = await prisma.story.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const totalViews = await prisma.story.aggregate({
      _sum: {
        viewCount: true
      }
    });

    // Get recent activity (latest stories and users)
    const recentStories = await prisma.story.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: {
            nickname: true
          }
        }
      }
    });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        createdAt: true
      }
    });

    const recentActivity = [
      ...recentStories.map(story => ({
        type: 'story',
        title: `Yeni hikaye: ${story.title}`,
        user: story.author.nickname,
        timestamp: story.createdAt
      })),
      ...recentUsers.map(user => ({
        type: 'user',
        title: `Yeni kullanıcı: ${user.nickname}`,
        user: user.nickname,
        timestamp: user.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    const metrics = {
      users: {
        total: totalUsers,
        today: todayUsers,
        active: activeUsers
      },
      stories: {
        total: totalStories,
        today: todayStories,
        totalViews: totalViews._sum.viewCount || 0
      },
      recentActivity
    };

    res.status(200).json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch metrics'
      }
    });
  } finally {
    await prisma.$disconnect();
  }
};