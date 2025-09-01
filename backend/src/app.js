import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import userRoutes from './routes/users.js';
import storyRoutes from './routes/stories.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Disable to allow cross-origin requests
  crossOriginOpenerPolicy: false   // Disable to allow cross-origin requests
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://sesimiz-ol.up.railway.app', // Railway production URL
        'https://sesimiz-ol.netlify.app',    // Netlify frontend (if used)
        /\.railway\.app$/                    // Allow any Railway subdomain
      ]
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // Development URLs
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
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
const uploadsPath = process.env.NODE_ENV === 'production' ? '/app/uploads' : 'uploads';
app.use('/uploads', cors(), express.static(uploadsPath, {
  setHeaders: (res, path) => {
    // Set CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', 
      process.env.NODE_ENV === 'production' 
        ? 'https://sesimiz-ol.netlify.app'
        : '*'
    );
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
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});

export default app;