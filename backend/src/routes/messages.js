import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All message routes require authentication
router.use(authenticateToken);

// Rate limiting middleware for messages
const messageRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production use Redis)
  if (!global.messageRateLimit) {
    global.messageRateLimit = new Map();
  }

  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const userRequests = global.messageRateLimit.get(userId) || [];
  const validRequests = userRequests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: { message: 'Çok fazla mesaj gönderiyorsunuz. Lütfen bekleyin.' }
    });
  }

  validRequests.push(now);
  global.messageRateLimit.set(userId, validRequests);
  next();
};

// Send message
router.post('/', messageRateLimit, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    // Validation
    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'Alıcı ID ve mesaj içeriği gerekli.' }
      });
    }

    if (content.length < 1 || content.length > 1000) {
      return res.status(400).json({
        success: false,
        error: { message: 'Mesaj 1-1000 karakter arasında olmalı.' }
      });
    }

    // Check if sender is blocked by receiver
    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        blockerId: receiverId,
        blockedId: senderId
      }
    });

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        error: { message: 'Bu kullanıcıya mesaj gönderemezsiniz.' }
      });
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: { message: 'Kullanıcı bulunamadı.' }
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Mesaj gönderilemedi.' }
    });
  }
});

// Get conversation history with a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Get messages between current user and specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: parseInt(userId) },
          { senderId: parseInt(userId), receiverId: currentUserId }
        ],
        deletedAt: null
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: parseInt(userId),
        receiverId: currentUserId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: currentUserId,
        readAt: null,
        deletedAt: null
      }
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: messages.length === parseInt(limit)
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Mesajlar getirilemedi.' }
    });
  }
});

// Get all conversations (list of users with last message)
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all messages involving current user
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ],
        deletedAt: null
      },
      include: {
        sender: {
          select: { id: true, nickname: true, avatar: true }
        },
        receiver: {
          select: { id: true, nickname: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by conversation partner
    const conversationMap = new Map();
    
    allMessages.forEach(message => {
      const partnerId = message.senderId === currentUserId 
        ? message.receiverId 
        : message.senderId;
      
      if (!conversationMap.has(partnerId)) {
        const partner = message.senderId === currentUserId 
          ? message.receiver 
          : message.sender;
          
        conversationMap.set(partnerId, {
          user: partner,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: 0
        });
      }
    });

    // Calculate unread count for each conversation
    for (const [partnerId, conversation] of conversationMap) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: partnerId,
          receiverId: currentUserId,
          readAt: null,
          deletedAt: null
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Konuşmalar getirilemedi.' }
    });
  }
});

// Mark message as read
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id;

    const message = await prisma.message.findUnique({
      where: { id: parseInt(messageId) }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: { message: 'Mesaj bulunamadı.' }
      });
    }

    if (message.receiverId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Bu mesajı okuma yetkiniz yok.' }
      });
    }

    await prisma.message.update({
      where: { id: parseInt(messageId) },
      data: { readAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Mesaj okundu olarak işaretlendi.'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Mesaj işaretlenemedi.' }
    });
  }
});

// Block a user
router.post('/block/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    if (parseInt(userId) === blockerId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Kendinizi engelleyemezsiniz.' }
      });
    }

    // Check if already blocked
    const existingBlock = await prisma.blockedUser.findFirst({
      where: {
        blockerId,
        blockedId: parseInt(userId)
      }
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        error: { message: 'Bu kullanıcı zaten engellenmiş.' }
      });
    }

    await prisma.blockedUser.create({
      data: {
        blockerId,
        blockedId: parseInt(userId)
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcı engellendi.'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Kullanıcı engellenemedi.' }
    });
  }
});

// Unblock a user
router.delete('/block/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId,
        blockedId: parseInt(userId)
      }
    });

    res.json({
      success: true,
      message: 'Kullanıcının engeli kaldırıldı.'
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Engel kaldırılamadı.' }
    });
  }
});

// Get blocked users list
router.get('/blocked/list', async (req, res) => {
  try {
    const blockerId = req.user.id;

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      blockedUsers: blockedUsers.map(item => ({
        ...item.blocked,
        blockedAt: item.createdAt
      }))
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Engellenmiş kullanıcılar getirilemedi.' }
    });
  }
});

// Search messages
router.get('/search', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Arama terimi en az 2 karakter olmalıdır'
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await prisma.message.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          {
            content: {
              contains: q.trim(),
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.message.count({
      where: {
        AND: [
          {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          {
            content: {
              contains: q.trim(),
              mode: 'insensitive'
            }
          }
        ]
      }
    });

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Mesaj araması başarısız'
      }
    });
  }
});

export default router;