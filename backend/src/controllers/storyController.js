import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

// GET /api/stories - List all stories with category filtering
export const getAllStories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : null;
    const search = req.query.search || '';

    // Build where clause
    const where = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
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
              tag: true
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
      prisma.story.count({ where })
    ]);

    res.json({
      success: true,
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
        commentCount: story._count.comments,
        tags: story.tags ? story.tags.map(st => st.tag) : []
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikayeler getirilemedi'
      }
    });
  }
};

// GET /api/stories/:id - Get story details
export const getStoryById = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
            bio: true
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
        },
        comments: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                avatar: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    nickname: true,
                    avatar: true
                  }
                },
                _count: {
                  select: { reactions: true }
                }
              }
            },
            _count: {
              select: { reactions: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: { comments: true }
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

    res.json({
      success: true,
      story
    });

  } catch (error) {
    console.error('Get story by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye getirilemedi'
      }
    });
  }
};

// POST /api/stories - Create new story
export const createStory = async (req, res) => {
  try {
    const { title, content, categoryId, organizationId } = req.body;
    const authorId = req.user.id;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Başlık ve içerik gereklidir'
        }
      });
    }

    if (title.length < 5 || title.length > 200) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TITLE',
          message: 'Başlık 5-200 karakter arasında olmalıdır'
        }
      });
    }

    if (content.length < 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT',
          message: 'İçerik en az 50 karakter olmalıdır'
        }
      });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category || !category.isActive) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Geçersiz kategori'
          }
        });
      }
    }

    // Validate organization if provided and check membership
    if (organizationId !== undefined) {
      if (organizationId) {
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId },
          include: {
            members: {
              where: { userId }
            }
          }
        });

        if (!organization || !organization.isActive) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ORGANIZATION',
              message: 'Geçersiz STK'
            }
          });
        }

        if (organization.members.length === 0) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'NOT_ORGANIZATION_MEMBER',
              message: 'Bu STK adına hikaye yazabilmek için üye olmalısınız'
            }
          });
        }
      }
    }



    // Generate unique slug
    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create story
    const story = await prisma.story.create({
      data: {
        title,
        content,
        slug,
        authorId,
        categoryId: categoryId || null,
        organizationId: organizationId || null
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

    res.status(201).json({
      success: true,
      story
    });

  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye oluşturulamadı'
      }
    });
  }
};

// PUT /api/stories/:id - Update story
export const updateStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const { title, content, categoryId, organizationId } = req.body;
    const userId = req.user.id;

    // Check if story exists and user is the author
    const existingStory = await prisma.story.findUnique({
      where: { id: storyId },
      include: { author: true }
    });

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STORY_NOT_FOUND',
          message: 'Hikaye bulunamadı'
        }
      });
    }

    if (existingStory.authorId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bu hikayeyi düzenleme yetkiniz yok'
        }
      });
    }

    // Validation
    if (title && (title.length < 5 || title.length > 200)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TITLE',
          message: 'Başlık 5-200 karakter arasında olmalıdır'
        }
      });
    }

    if (content && content.length < 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT',
          message: 'İçerik en az 50 karakter olmalıdır'
        }
      });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category || !category.isActive) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Geçersiz kategori'
          }
        });
      }
    }

    // Update data
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (organizationId !== undefined) updateData.organizationId = organizationId || null;

    // Generate new slug if title changed
    if (title && title !== existingStory.title) {
      const baseSlug = generateSlug(title);
      updateData.slug = await ensureUniqueSlug(baseSlug, storyId);
    }

    const story = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
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
      story
    });

  } catch (error) {
    console.error('Update story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye güncellenemedi'
      }
    });
  }
};

// DELETE /api/stories/:id - Delete story
export const deleteStory = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
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
          message: 'Bu hikayeyi silme yetkiniz yok'
        }
      });
    }

    await prisma.story.delete({
      where: { id: storyId }
    });

    res.json({
      success: true,
      message: 'Hikaye başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Hikaye silinemedi'
      }
    });
  }
};

// POST /api/stories/:id/view - Increment view count
export const incrementViewCount = async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);

    await prisma.story.update({
      where: { id: storyId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      message: 'Görüntülenme sayısı güncellendi'
    });

  } catch (error) {
    console.error('Increment view count error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Görüntülenme sayısı güncellenemedi'
      }
    });
  }
};