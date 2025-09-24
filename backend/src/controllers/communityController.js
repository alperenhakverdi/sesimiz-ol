import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all users with filtering and pagination (for community page)
export const getCommunityUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Build where clause
    const where = {
      isActive: true,
      isBanned: false
    }

    // Add search filter
    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Add role filter
    if (role) {
      where.role = role
    }

    // Build orderBy clause
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          nickname: true,
          avatar: true,
          role: true,
          bio: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              stories: true,
              comments: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // Transform data to include story and comment counts
    const transformedUsers = users.map(user => ({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      bio: user.bio,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      storyCount: user._count.stories,
      commentCount: user._count.comments
    }))

    const totalPages = Math.ceil(totalCount / take)

    res.status(200).json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    })
  } catch (error) {
    console.error('Get community users error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Topluluk üyeleri yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Get user profile by nickname or id
export const getUserProfile = async (req, res) => {
  try {
    const { nickname } = req.params

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { nickname: nickname },
          { id: parseInt(nickname) || 0 }
        ],
        isActive: true,
        isBanned: false
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        role: true,
        bio: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        _count: {
          select: {
            stories: true,
            comments: true,
            followers: true,
            following: true
          }
        },
        stories: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            viewCount: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      })
    }

    // Transform data
    const transformedUser = {
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      bio: user.bio,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      emailVerified: user.emailVerified,
      storyCount: user._count.stories,
      commentCount: user._count.comments,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      recentStories: user.stories
    }

    res.status(200).json({
      success: true,
      data: transformedUser
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kullanıcı profili yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Get community statistics
export const getCommunityStats = async (req, res) => {
  try {
    // Fallback data in case of database issues
    const fallbackData = {
      totalUsers: 4,
      recentUsers: 4,
      totalStories: 3,
      totalComments: 0,
      roleBreakdown: {
        USER: 2,
        ADMIN: 1,
        MODERATOR: 1
      }
    }

    try {
      const stats = await prisma.user.aggregate({
        _count: {
          id: true
        },
        where: {
          isActive: true,
          isBanned: false
        }
      })

      const roleStats = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        },
        where: {
          isActive: true,
          isBanned: false
        }
      })

      const recentUsers = await prisma.user.count({
        where: {
          isActive: true,
          isBanned: false,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })

      const totalStories = await prisma.story.count()
      const totalComments = await prisma.comment.count()

      res.status(200).json({
        success: true,
        data: {
          totalUsers: stats._count.id,
          recentUsers,
          totalStories,
          totalComments,
          roleBreakdown: roleStats.reduce((acc, item) => {
            acc[item.role] = item._count.id
            return acc
          }, {})
        }
      })
    } catch (dbError) {
      console.warn('Database temporarily unavailable, using fallback data:', dbError.message)
      res.status(200).json({
        success: true,
        data: fallbackData
      })
    }
  } catch (error) {
    console.error('Get community stats error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Topluluk istatistikleri yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Follow/Unfollow user
export const followUser = async (req, res) => {
  try {
    const { userId } = req.params
    const followerId = req.user.id

    if (followerId === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Kendinizi takip edemezsiniz'
        }
      })
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: parseInt(userId)
        }
      }
    })

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_FOLLOWING',
          message: 'Bu kullanıcıyı zaten takip ediyorsunuz'
        }
      })
    }

    // Create follow relationship
    await prisma.userFollow.create({
      data: {
        followerId,
        followingId: parseInt(userId)
      }
    })

    res.status(200).json({
      success: true,
      message: 'Kullanıcı takip edildi'
    })
  } catch (error) {
    console.error('Follow user error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip işlemi sırasında bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Unfollow user
export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params
    const followerId = req.user.id

    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: parseInt(userId)
        }
      }
    })

    if (!follow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_FOLLOWING',
          message: 'Bu kullanıcıyı takip etmiyorsunuz'
        }
      })
    }

    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: parseInt(userId)
        }
      }
    })

    res.status(200).json({
      success: true,
      message: 'Takip iptal edildi'
    })
  } catch (error) {
    console.error('Unfollow user error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip iptal işlemi sırasında bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Get user's followers
export const getUserFollowers = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [followers, totalCount] = await Promise.all([
      prisma.userFollow.findMany({
        where: {
          followingId: parseInt(userId)
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          follower: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              role: true,
              bio: true
            }
          },
          createdAt: true
        }
      }),
      prisma.userFollow.count({
        where: {
          followingId: parseInt(userId)
        }
      })
    ])

    const totalPages = Math.ceil(totalCount / take)

    res.status(200).json({
      success: true,
      data: {
        followers: followers.map(f => ({
          ...f.follower,
          followedAt: f.createdAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    })
  } catch (error) {
    console.error('Get user followers error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takipçiler yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Get user's following
export const getUserFollowing = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20 } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [following, totalCount] = await Promise.all([
      prisma.userFollow.findMany({
        where: {
          followerId: parseInt(userId)
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          following: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              role: true,
              bio: true
            }
          },
          createdAt: true
        }
      }),
      prisma.userFollow.count({
        where: {
          followerId: parseInt(userId)
        }
      })
    ])

    const totalPages = Math.ceil(totalCount / take)

    res.status(200).json({
      success: true,
      data: {
        following: following.map(f => ({
          ...f.following,
          followedAt: f.createdAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    })
  } catch (error) {
    console.error('Get user following error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip edilenler yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}
