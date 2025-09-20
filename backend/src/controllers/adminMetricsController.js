import { firebaseService, isFirebaseEnabled } from '../services/firebase.js';

// GET /api/admin/metrics - Get admin dashboard metrics
export const getMetrics = async (req, res) => {
  try {
    if (!isFirebaseEnabled) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Firebase service is not configured.'
        }
      });
    }

    // Get user metrics
    const userMetrics = await firebaseService.getUserMetrics();

    // Get story metrics
    const storyMetrics = await firebaseService.getStoryMetrics();

    // Get recent activity
    const recentActivity = await firebaseService.getRecentActivity();

    const metrics = {
      users: {
        total: userMetrics.total || 0,
        today: userMetrics.today || 0,
        active: userMetrics.active || 0
      },
      stories: {
        total: storyMetrics.total || 0,
        today: storyMetrics.today || 0,
        totalViews: storyMetrics.totalViews || 0
      },
      recentActivity: recentActivity || []
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
  }
};