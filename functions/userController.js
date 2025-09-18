import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = Joi.object({
  nickname: Joi.string().min(2).max(50).required(),
  avatar: Joi.string().uri().optional()
});

const updateUserSchema = Joi.object({
  nickname: Joi.string().min(2).max(50).optional(),
  avatar: Joi.string().uri().optional()
});

// Create new user (registration)
export const createUser = async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => detail.message)
        }
      });
    }

    const { nickname, avatar } = value;

    // Check if nickname already exists
    const existingUser = await prisma.user.findUnique({
      where: { nickname }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NICKNAME_EXISTS',
          message: 'Bu takma ad zaten kullanılıyor'
        }
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: { nickname, avatar },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { stories: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Kullanıcı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kullanıcı oluşturulurken bir hata oluştu'
      }
    });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Geçersiz kullanıcı ID'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { stories: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kullanıcı profili alınırken bir hata oluştu'
      }
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Geçersiz kullanıcı ID'
        }
      });
    }

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => detail.message)
        }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Kullanıcı bulunamadı'
        }
      });
    }

    // Check if new nickname is already taken (if changing nickname)
    if (value.nickname && value.nickname !== existingUser.nickname) {
      const nicknameExists = await prisma.user.findUnique({
        where: { nickname: value.nickname }
      });

      if (nicknameExists) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'NICKNAME_EXISTS',
            message: 'Bu takma ad zaten kullanılıyor'
          }
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: value,
      select: {
        id: true,
        nickname: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { stories: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Profil başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Profil güncellenirken bir hata oluştu'
      }
    });
  }
};

// Get user's stories
export const getUserStories = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_ID',
          message: 'Geçersiz kullanıcı ID'
        }
      });
    }

    const stories = await prisma.story.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Kullanıcı hikâyeleri alınırken bir hata oluştu'
      }
    });
  }
};