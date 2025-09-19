import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
// Firebase kullanıyoruz artık

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRoutes from './routes/users.js';
import storyRoutes from './routes/stories.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers - Phase 1.1: Enhanced security configuration
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://sesimiz-ol.firebaseapp.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },

  // Cross-Origin Resource Policy - Enable with specific values
  crossOriginResourcePolicy: {
    policy: process.env.NODE_ENV === 'production' ? "same-site" : "cross-origin"
  },

  // Cross-Origin Opener Policy - Enable for better security
  crossOriginOpenerPolicy: {
    policy: "same-origin-allow-popups"
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disable for now to avoid breaking changes

  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },

  // Frame Guard (X-Frame-Options)
  frameguard: { action: 'deny' },

  // Hide Powered By Header
  hidePoweredBy: true,

  // HTTP Strict Transport Security (HTTPS only)
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false,

  // IE No Open
  ieNoOpen: true,

  // No Sniff
  noSniff: true,

  // Origin Agent Cluster
  originAgentCluster: true,

  // Permitted Cross Domain Policies
  permittedCrossDomainPolicies: false,

  // Referrer Policy
  referrerPolicy: { policy: "no-referrer" },

  // X-XSS-Protection
  xssFilter: true
}));
// Enhanced CORS configuration - Phase 1.1: Environment-based security
const corsOptions = {
  origin: function(origin, callback) {
    // Get allowed origins from environment variables
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(url => url.trim())
      : ['http://localhost:5173', 'https://sesimiz-ol.firebaseapp.com', 'https://sesimiz-ol.web.app'];

    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
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
  maxAge: 86400 // 24 hours preflight cache
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

// Health check endpoint (simple version for debugging)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'undefined',
    port: process.env.PORT || 'undefined'
  });
});

// Seed database endpoint for free tier deployment
app.get('/seed-database', async (req, res) => {
  try {
    console.log('🌱 Seed database başlatıldı...');
    
    // Import and run seed function
    const { execSync } = await import('child_process');
    execSync('node src/seedDatabase.js', { stdio: 'inherit' });
    
    res.status(200).json({
      success: true,
      message: 'Veritabanı başarıyla dolduruldu!',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Seed hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Seed işlemi başarısız',
      error: error.message
    });
  }
});

// API Routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Sesimiz Ol API Server',
    version: '2.0.0',
    endpoints: [
      // Authentication
      'POST /api/auth/register - Register new user',
      'POST /api/auth/login - Login user',
      'POST /api/auth/refresh - Refresh token',
      'GET /api/auth/profile - Get user profile',
      'PUT /api/auth/profile - Update profile',
      'PUT /api/auth/password - Change password',
      // Stories
      'GET /api/stories - List all stories',
      'GET /api/stories/:id - Get story details',
      'POST /api/stories/:id/view - Increment view count',
      'POST /api/stories - Create new story',
      // Upload
      'POST /api/upload/avatar - Upload avatar',
      'GET /uploads/avatars/:filename - Get avatar file',
      // Legacy
      'POST /api/users - Create user',
      'GET /api/users/:id - Get user profile'
    ]
  });
});

// Static file serving with CORS headers
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', cors(), express.static(uploadsPath, {
  setHeaders: (res, path) => {
    // Set CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Set appropriate content type for images
    if (path.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    
    // Cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  }
}));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});

export default app;