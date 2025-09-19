const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Security Headers - Phase 1.1: Firebase Functions Security
app.use(helmet({
  // Content Security Policy for Firebase Functions
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://firebaseapp.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },

  // Basic security headers
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "no-referrer" }
}));

// Enhanced CORS configuration - Phase 1.1: Secure Firebase Functions
const corsOptions = {
  origin: function(origin, callback) {
    // Allowed origins for Firebase Functions
    const allowedOrigins = [
      'https://sesimiz-ol.firebaseapp.com',
      'https://sesimiz-ol.web.app',
      'http://localhost:5173', // Development only
      'http://localhost:3001'  // Local backend
    ];

    // Allow requests with no origin in development
    if (!origin && functions.config().runtime?.env === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Firebase Functions CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by Firebase Functions CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'X-CSRF-Token'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400
};

app.use(cors(corsOptions));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer for multipart/form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Firestore database reference
const db = admin.firestore();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sesimiz-ol-api',
    version: '1.0.0',
    database: 'firebase-firestore',
    port: 'cloud-functions'
  });
});

// Stories endpoint - simplified for Cloud Functions
app.get('/api/stories', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const storiesRef = db.collection('stories');
    const snapshot = await storiesRef
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const stories = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      stories.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      });
    });
    
    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page,
          limit,
          total: stories.length,
          totalPages: Math.ceil(stories.length / limit),
          hasNext: false,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Stories fetch error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch stories' }
    });
  }
});

// Single story endpoint
app.get('/api/stories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const storyRef = db.collection('stories').doc(id);
    const storySnap = await storyRef.get();
    
    if (!storySnap.exists) {
      return res.status(404).json({
        error: { message: 'Story not found' }
      });
    }
    
    const storyData = storySnap.data();
    const story = {
      id: storySnap.id,
      ...storyData,
      createdAt: storyData.createdAt?.toDate?.() || storyData.createdAt
    };
    
    res.json({
      success: true,
      data: {
        story,
        comments: [] // TODO: Implement comments
      }
    });
  } catch (error) {
    console.error('Story fetch error:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch story' }
    });
  }
});

// View increment endpoint
app.post('/api/stories/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const storyRef = db.collection('stories').doc(id);
    
    await storyRef.update({
      viewCount: admin.firestore.FieldValue.increment(1)
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('View increment error:', error);
    res.status(500).json({
      error: { message: 'Failed to increment view count' }
    });
  }
});

// Auth endpoints - Support both JSON and FormData
app.post('/api/auth/register', (req, res, next) => {
  // Check content type and apply appropriate middleware
  const contentType = req.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('avatar')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    console.log('Register content-type:', req.get('content-type'));
    const { nickname, email, avatar } = req.body;
    
    if (!nickname || nickname.trim() === '') {
      return res.status(400).json({
        error: { message: 'Kullanıcı adı gerekli' }
      });
    }
    
    // Check if nickname exists
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('nickname', '==', nickname).get();
    
    if (!existingUser.empty) {
      return res.status(409).json({
        error: { message: 'Bu kullanıcı adı zaten kullanılıyor' }
      });
    }
    
    // Generate temporary user ID for filename
    const tempUserId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Process avatar - store base64 directly in Firestore for now
    let avatarUrl = `https://i.pravatar.cc/150?u=${Math.floor(Math.random() * 1000)}`;
    
    if (avatar && avatar.startsWith('data:image/')) {
      // For now, use the base64 directly as avatar URL
      // This works for small images and avoids Storage setup
      avatarUrl = avatar;
    }

    // Create user
    const userRef = await usersRef.add({
      nickname,
      email: email || '',
      avatar: avatarUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    const userData = await userRef.get();
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userRef.id,
          ...userData.data(),
          createdAt: userData.data().createdAt?.toDate?.() || userData.data().createdAt
        },
        token: `mock-token-${userRef.id}` // Mock token for now
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: { message: 'Kayıt işlemi başarısız' }
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { nickname } = req.body;
    
    if (!nickname) {
      return res.status(400).json({
        error: { message: 'Kullanıcı adı gerekli' }
      });
    }
    
    // Find user by nickname
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('nickname', '==', nickname).get();
    
    if (userQuery.empty) {
      return res.status(404).json({
        error: { message: 'Kullanıcı bulunamadı' }
      });
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate?.() || userData.createdAt
        },
        token: `mock-token-${userDoc.id}` // Mock token for now
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'Giriş işlemi başarısız' }
    });
  }
});

// Get user profile endpoint
app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: { message: 'Authorization header required' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    // For mock token, extract user ID
    const userId = token.replace('mock-token-', '');
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: { message: 'Kullanıcı bulunamadı' }
      });
    }
    
    const userData = userDoc.data();
    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          nickname: userData.nickname,
          email: userData.email,
          avatar: userData.avatar,
          isActive: userData.isActive,
          createdAt: userData.createdAt?.toDate?.() || userData.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: { message: 'Profil bilgileri alınamadı' }
    });
  }
});

// Update user profile endpoint
app.put('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: { message: 'Authorization header required' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('mock-token-', '');
    
    const { nickname, email, avatar } = req.body;
    
    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (email !== undefined) updateData.email = email;
    if (avatar && avatar.startsWith('data:image/')) {
      updateData.avatar = avatar;
    }
    
    const userRef = db.collection('users').doc(userId);
    await userRef.update(updateData);
    
    const updatedDoc = await userRef.get();
    const userData = updatedDoc.data();
    
    res.json({
      success: true,
      data: {
        user: {
          id: updatedDoc.id,
          nickname: userData.nickname,
          email: userData.email,
          avatar: userData.avatar,
          isActive: userData.isActive,
          createdAt: userData.createdAt?.toDate?.() || userData.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: { message: 'Profil güncellenemedi' }
    });
  }
});

// Story creation endpoint  
app.post('/api/stories', async (req, res) => {
  try {
    const { title, content, authorNickname, authorId } = req.body;
    
    if (!title || !content || !authorNickname) {
      return res.status(400).json({
        error: { message: 'Başlık, içerik ve yazar bilgisi gerekli' }
      });
    }
    
    // Get author info
    const authorRef = db.collection('users').doc(authorId);
    const authorDoc = await authorRef.get();
    
    const storyData = {
      title,
      content,
      authorId,
      authorNickname,
      authorAvatar: authorDoc.exists ? authorDoc.data().avatar : `https://i.pravatar.cc/150?u=${Math.floor(Math.random() * 1000)}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      viewCount: 0
    };
    
    const storyRef = await db.collection('stories').add(storyData);
    const createdStory = await storyRef.get();
    
    res.status(201).json({
      success: true,
      data: {
        story: {
          id: storyRef.id,
          ...createdStory.data(),
          createdAt: createdStory.data().createdAt?.toDate?.() || createdStory.data().createdAt
        }
      }
    });
  } catch (error) {
    console.error('Story creation error:', error);
    res.status(500).json({
      error: { message: 'Hikâye oluşturma başarısız' }
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Sesimiz Ol API',
    version: '1.0.0',
    description: 'API for digital storytelling platform - Firebase Edition',
    endpoints: {
      health: '/health',
      stories: '/api/stories',
      users: '/api/users',
      auth: '/api/auth',
      upload: '/api/upload'
    },
    database: 'Firebase Firestore',
    deployment: 'Firebase Cloud Functions'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      path: req.originalUrl,
      method: req.method
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});

// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);
