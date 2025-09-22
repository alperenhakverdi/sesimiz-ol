import { Server } from 'socket.io';
import { verifyToken } from './auth.js';
import logSecurityEvent from './securityLogger.js';

let io = null;
const connectedUsers = new Map(); // userId -> socketId mapping
const userSockets = new Map(); // socketId -> userId mapping

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw new Error('No authentication token provided');
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      logSecurityEvent({
        event: 'WEBSOCKET_AUTH_SUCCESS',
        userId: decoded.userId,
        ip: socket.handshake.address,
        meta: { socketId: socket.id }
      });

      next();
    } catch (error) {
      logSecurityEvent({
        event: 'WEBSOCKET_AUTH_FAILED',
        userId: null,
        ip: socket.handshake.address,
        meta: { error: error.message, socketId: socket.id }
      });

      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;

    // Store user connection
    connectedUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);



    // Join user to their personal room for private notifications
    socket.join(`user_${userId}`);

    // Join admin users to admin room
    if (socket.userRole === 'ADMIN') {
      socket.join('admin_room');
    }

    // Handle user disconnect
    socket.on('disconnect', () => {

      connectedUsers.delete(userId);
      userSockets.delete(socket.id);

      logSecurityEvent({
        event: 'WEBSOCKET_DISCONNECT',
        userId: userId,
        ip: socket.handshake.address,
        meta: { socketId: socket.id }
      });
    });

    // Handle notification read acknowledgment
    socket.on('notification_read', (notificationId) => {
      logSecurityEvent({
        event: 'NOTIFICATION_READ',
        userId: userId,
        ip: socket.handshake.address,
        meta: { notificationId, socketId: socket.id }
      });
    });

    // Handle typing indicators for messages (future feature)
    socket.on('typing_start', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: userId,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: userId,
        isTyping: false
      });
    });
  });

  return io;
};

// Notification broadcasting functions
export const broadcastToUser = (userId, event, data) => {
  if (!io) {
    console.warn('Socket.io not initialized. Cannot broadcast notification.');
    return false;
  }

  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(`user_${userId}`).emit(event, data);
    return true;
  }

  return false; // User not connected
};

export const broadcastToAdmins = (event, data) => {
  if (!io) {
    console.warn('Socket.io not initialized. Cannot broadcast to admins.');
    return false;
  }

  io.to('admin_room').emit(event, data);
  return true;
};

export const broadcastToAll = (event, data) => {
  if (!io) {
    console.warn('Socket.io not initialized. Cannot broadcast to all users.');
    return false;
  }

  io.emit(event, data);
  return true;
};

// Notification types for real-time events
export const NOTIFICATION_TYPES = {
  STORY_APPROVED: 'story_approved',
  STORY_REJECTED: 'story_rejected',
  STORY_COMMENTED: 'story_commented',
  MESSAGE_RECEIVED: 'message_received',
  ANNOUNCEMENT_CREATED: 'announcement_created',
  ADMIN_ALERT: 'admin_alert',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  CONTENT_MODERATION: 'content_moderation'
};

// Helper function to send notifications
export const sendNotification = async (userId, type, data) => {
  const notification = {
    id: Date.now(), // Simple ID generation, should use proper UUID in production
    type,
    title: data.title,
    message: data.message,
    data: data.extra || {},
    timestamp: new Date().toISOString(),
    read: false
  };

  // Store notification in database (will implement with notification service)
  // await notificationService.create(userId, notification);

  // Send real-time notification
  const sent = broadcastToUser(userId, 'notification', notification);

  logSecurityEvent({
    event: 'NOTIFICATION_SENT',
    userId: userId,
    ip: null,
    meta: {
      type,
      title: data.title,
      realTime: sent,
      notificationId: notification.id
    }
  });

  return notification;
};

export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

export const isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

export default {
  initializeSocket,
  broadcastToUser,
  broadcastToAdmins,
  broadcastToAll,
  sendNotification,
  getConnectedUsers,
  isUserConnected,
  NOTIFICATION_TYPES
};