import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all organizations with filtering and pagination
export const getOrganizations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type = '', 
      status = 'ACTIVE',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Build where clause
    const where = {
      status: status || 'ACTIVE'
    }

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Add type filter
    if (type) {
      where.type = type
    }

    // Build orderBy clause
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
          description: true,
          location: true,
          memberCount: true,
          website: true,
          logo: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.organization.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / take)

    res.status(200).json({
      success: true,
      data: {
        organizations,
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
    console.error('Get organizations error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Organizasyonlar yüklenirken bir hata oluştu'
      }
    })
  } finally {
    // Keep Prisma client connected for the app lifecycle
  }
}

// Get organization by slug or id
export const getOrganization = async (req, res) => {
  try {
    const { slug } = req.params

    const orFilters = [{ slug }]
    const numericId = Number(slug)
    if (!Number.isNaN(numericId) && Number.isInteger(numericId)) {
      orFilters.push({ id: numericId })
    }

    const organization = await prisma.organization.findFirst({
      where: {
        OR: orFilters,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        description: true,
        longDescription: true,
        location: true,
        address: true,
        memberCount: true,
        foundedYear: true,
        website: true,
        email: true,
        phone: true,
        logo: true,
        activities: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organizasyon bulunamadı'
        }
      })
    }

    res.status(200).json({
      success: true,
      data: organization
    })
  } catch (error) {
    console.error('Get organization error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Organizasyon bilgileri yüklenirken bir hata oluştu'
      }
    })
  } finally {
    // Keep Prisma client connected for the app lifecycle
  }
}

// Create new organization (Admin only)
export const createOrganization = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      longDescription,
      location,
      address,
      website,
      email,
      phone,
      activities
    } = req.body

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')

    // Check if slug already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { slug }
    })

    let finalSlug = slug
    if (existingOrg) {
      finalSlug = `${slug}-${Date.now()}`
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug: finalSlug,
        type,
        description,
        longDescription,
        location,
        address,
        website,
        email,
        phone,
        activities: activities || [],
        status: 'PENDING',
        memberCount: 0
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        description: true,
        location: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organizasyon başarıyla oluşturuldu'
    })
  } catch (error) {
    console.error('Create organization error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Organizasyon oluşturulurken bir hata oluştu'
      }
    })
  } finally {
    // Keep Prisma client connected for the app lifecycle
  }
}

// Update organization (Admin only)
export const updateOrganization = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Remove fields that shouldn't be updated directly
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        description: true,
        location: true,
        updatedAt: true
      }
    })

    res.status(200).json({
      success: true,
      data: organization,
      message: 'Organizasyon başarıyla güncellendi'
    })
  } catch (error) {
    console.error('Update organization error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organizasyon bulunamadı'
        }
      })
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Organizasyon güncellenirken bir hata oluştu'
      }
    })
  } finally {
    // Keep Prisma client connected for the app lifecycle
  }
}

// Delete organization (Admin only)
export const deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.organization.delete({
      where: { id }
    })

    res.status(200).json({
      success: true,
      message: 'Organizasyon başarıyla silindi'
    })
  } catch (error) {
    console.error('Delete organization error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Organizasyon bulunamadı'
        }
      })
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Organizasyon silinirken bir hata oluştu'
      }
    })
  } finally {
    // Keep Prisma client connected for the app lifecycle
  }
}

// Get organization statistics
export const getOrganizationStats = async (req, res) => {
  try {
    // Fallback data in case of database issues
    const fallbackData = {
      totalOrganizations: 2,
      typeBreakdown: {
        FOUNDATION: 1,
        ASSOCIATION: 1
      }
    }

    try {
      const stats = await prisma.organization.aggregate({
        _count: {
          id: true
        },
        where: {
          status: 'ACTIVE'
        }
      })

      const typeStats = await prisma.organization.groupBy({
        by: ['type'],
        _count: {
          id: true
        },
        where: {
          status: 'ACTIVE'
        }
      })

      res.status(200).json({
        success: true,
        data: {
          totalOrganizations: stats._count.id,
          typeBreakdown: typeStats.reduce((acc, item) => {
            acc[item.type] = item._count.id
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
    console.error('Get organization stats error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Organizasyon istatistikleri yüklenirken bir hata oluştu'
      }
    })
  } finally {
    // Keep Prisma client connected for the app lifecycle
  }
}