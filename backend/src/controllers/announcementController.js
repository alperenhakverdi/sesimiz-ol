import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all announcements with filtering and pagination
export const getAnnouncements = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type = '', 
      visibility = 'PUBLIC',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    // Build where clause
    const where = {
      visibility: visibility || 'PUBLIC',
      isActive: true
    }

    // Add type filter
    if (type) {
      where.type = type
    }

    // Add date filters
    const now = new Date()
    where.OR = [
      { startsAt: null },
      { startsAt: { lte: now } }
    ]

    where.AND = [
      {
        OR: [
          { endsAt: null },
          { endsAt: { gte: now } }
        ]
      }
    ]

    // Build orderBy clause
    const orderBy = {}
    orderBy[sortBy] = sortOrder

    const [announcements, totalCount] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          title: true,
          body: true,
          type: true,
          visibility: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              nickname: true
            }
          }
        }
      }),
      prisma.announcement.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / take)

    res.status(200).json({
      success: true,
      data: {
        announcements,
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
    console.error('Get announcements error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Duyurular yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Get announcement by id
export const getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params

    const announcement = await prisma.announcement.findFirst({
      where: {
        id: parseInt(id),
        isActive: true
      },
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        visibility: true,
        startsAt: true,
        endsAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    })

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Duyuru bulunamadı'
        }
      })
    }

    res.status(200).json({
      success: true,
      data: announcement
    })
  } catch (error) {
    console.error('Get announcement error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Duyuru bilgileri yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Create new announcement (Admin only)
export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      body,
      type = 'GENERAL',
      visibility = 'PUBLIC',
      startsAt,
      endsAt
    } = req.body

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        type,
        visibility,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        createdById: req.user.id,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        visibility: true,
        startsAt: true,
        endsAt: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Duyuru başarıyla oluşturuldu'
    })
  } catch (error) {
    console.error('Create announcement error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Duyuru oluşturulurken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Update announcement (Admin only)
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Remove fields that shouldn't be updated directly
    delete updateData.id
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.createdById

    // Convert date strings to Date objects
    if (updateData.startsAt) {
      updateData.startsAt = new Date(updateData.startsAt)
    }
    if (updateData.endsAt) {
      updateData.endsAt = new Date(updateData.endsAt)
    }

    const announcement = await prisma.announcement.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        visibility: true,
        startsAt: true,
        endsAt: true,
        updatedAt: true
      }
    })

    res.status(200).json({
      success: true,
      data: announcement,
      message: 'Duyuru başarıyla güncellendi'
    })
  } catch (error) {
    console.error('Update announcement error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Duyuru bulunamadı'
        }
      })
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Duyuru güncellenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Delete announcement (Admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.announcement.delete({
      where: { id: parseInt(id) }
    })

    res.status(200).json({
      success: true,
      message: 'Duyuru başarıyla silindi'
    })
  } catch (error) {
    console.error('Delete announcement error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Duyuru bulunamadı'
        }
      })
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Duyuru silinirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}

// Get announcement statistics
export const getAnnouncementStats = async (req, res) => {
  try {
    const stats = await prisma.announcement.aggregate({
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    })

    const typeStats = await prisma.announcement.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    })

    const visibilityStats = await prisma.announcement.groupBy({
      by: ['visibility'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    })

    res.status(200).json({
      success: true,
      data: {
        totalAnnouncements: stats._count.id,
        typeBreakdown: typeStats.reduce((acc, item) => {
          acc[item.type] = item._count.id
          return acc
        }, {}),
        visibilityBreakdown: visibilityStats.reduce((acc, item) => {
          acc[item.visibility] = item._count.id
          return acc
        }, {})
      }
    })
  } catch (error) {
    console.error('Get announcement stats error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Duyuru istatistikleri yüklenirken bir hata oluştu'
      }
    })
  } finally {
    await prisma.$disconnect()
  }
}
