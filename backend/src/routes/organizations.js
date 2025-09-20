import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for organization creation
const orgCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 organization creation attempts per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla STK oluşturma denemesi. Lütfen 1 saat bekleyin.'
    }
  }
});

// Helper function to generate slug from name
const generateOrgSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Helper function to ensure unique slug
const ensureUniqueOrgSlug = async (baseSlug, orgId = null) => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!existing || (orgId && existing.id === orgId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// GET /api/organizations - List all organizations (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const isNgo = req.query.isNgo;
    const isVerified = req.query.isVerified;

    // Build where clause
    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isNgo !== undefined) {
      where.isNgo = isNgo === 'true';
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: {
              stories: true,
              followers: true,
              members: true
            }
          }
        },
        orderBy: [
          { isVerified: 'desc' },
          { _count: { followers: 'desc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.organization.count({ where })
    ]);

    res.json({
      success: true,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        website: org.website,
        contactEmail: org.contactEmail,
        logo: org.logo,
        isNgo: org.isNgo,
        isVerified: org.isVerified,
        createdAt: org.createdAt,
        stats: {
          storiesCount: org._count.stories,
          followersCount: org._count.followers,
          membersCount: org._count.members
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
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'STK listesi getirilemedi'
      }
    });
  }
});

// POST /api/organizations/:slug/follow - Follow organization
router.post('/:slug/follow', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'STK bulunamadı'
        }
      });
    }

    // Check if already following
    const existingFollow = await prisma.stkFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_FOLLOWING',
          message: 'Bu STK\'yı zaten takip ediyorsunuz'
        }
      });
    }

    // Create follow relationship
    await prisma.stkFollow.create({
      data: {
        userId,
        organizationId: organization.id
      }
    });

    res.json({
      success: true,
      message: 'STK takip edilmeye başlandı'
    });

  } catch (error) {
    console.error('Follow organization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'STK takip işlemi başarısız'
      }
    });
  }
});

// DELETE /api/organizations/:slug/follow - Unfollow organization
router.delete('/:slug/follow', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { slug }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'STK bulunamadı'
        }
      });
    }

    // Check if following
    const existingFollow = await prisma.stkFollow.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id
        }
      }
    });

    if (!existingFollow) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_FOLLOWING',
          message: 'Bu STK\'yı takip etmiyorsunuz'
        }
      });
    }

    // Remove follow relationship
    await prisma.stkFollow.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: organization.id
        }
      }
    });

    res.json({
      success: true,
      message: 'STK takibi bırakıldı'
    });

  } catch (error) {
    console.error('Unfollow organization error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'STK takip bırakma işlemi başarısız'
      }
    });
  }
});

// GET /api/organizations/followed - Get user's followed organizations
router.get('/followed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      prisma.stkFollow.findMany({
        where: { userId },
        include: {
          organization: {
            include: {
              _count: {
                select: {
                  stories: true,
                  followers: true,
                  members: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.stkFollow.count({
        where: { userId }
      })
    ]);

    res.json({
      success: true,
      organizations: follows.map(follow => ({
        id: follow.id,
        followedAt: follow.createdAt,
        organization: {
          id: follow.organization.id,
          name: follow.organization.name,
          slug: follow.organization.slug,
          description: follow.organization.description,
          logo: follow.organization.logo,
          isNgo: follow.organization.isNgo,
          isVerified: follow.organization.isVerified,
          stats: {
            storiesCount: follow.organization._count.stories,
            followersCount: follow.organization._count.followers,
            membersCount: follow.organization._count.members
          }
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
    console.error('Get followed organizations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Takip edilen STK\'lar getirilemedi'
      }
    });
  }
});

export default router;