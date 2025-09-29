import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@chakra-ui/react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const toast = useToast();
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  const connectSocket = () => {
    if (!user || !token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);

      // Auto-reconnect for certain reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }

      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`🔄 Attempting to reconnect... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          reconnectAttempts.current++;
          connectSocket();
        }, delay);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Notification handlers
    newSocket.on('notification', (notification) => {
      console.log('📨 New notification received:', notification);

      // Add to notifications list
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        status: notification.priority === 'HIGH' || notification.priority === 'URGENT' ? 'warning' : 'info',
        duration: notification.priority === 'URGENT' ? 10000 : 5000,
        isClosable: true,
        position: 'top-right'
      });
    });

    newSocket.on('admin_notification', (notification) => {
      if (user?.role === 'ADMIN') {
        console.log('👨‍💼 Admin notification received:', notification);

        toast({
          title: `[Admin] ${notification.title}`,
          description: notification.message,
          status: 'warning',
          duration: 10000,
          isClosable: true,
          position: 'top-right'
        });
      }
    });

    // Message handlers (for future implementation)
    newSocket.on('message_received', (message) => {
      console.log('💬 New message received:', message);

      toast({
        title: 'Yeni Mesaj',
        description: `${message.senderName}: ${message.preview}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Initialize socket when user logs in
  useEffect(() => {
    if (user && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Notification management functions
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );

    if (socket && socket.connected) {
      socket.emit('notification_read', notificationId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const sendTypingIndicator = (conversationId, isTyping) => {
    if (socket && socket.connected) {
      if (isTyping) {
        socket.emit('typing_start', { conversationId });
      } else {
        socket.emit('typing_stop', { conversationId });
      }
    }
  };

  const value = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications,
    sendTypingIndicator,
    setUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;