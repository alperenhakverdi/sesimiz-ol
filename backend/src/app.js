import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
// Firebase kullanıyoruz artık

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import userRoutes from './routes/users.js';
import storyRoutes from './routes/stories.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin/index.js';
import messageRoutes from './routes/messages.js';
import commentRoutes from './routes/comments.js';
import activityRoutes from './routes/activity.js';
import { recordSecurityMetric } from './services/metrics.js';
import { refreshFeatureFlags } from './services/featureFlags.js';

const app = express();
const PORT = process.env.PORT || 3001;
const currentEnvironment = (process.env.NODE_ENV || 'development').toLowerCase();

const parseList = value =>
  value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

const buildRegexList = value =>
  parseList(value).reduce((patterns, rawPattern) => {
    try {
      patterns.push(new RegExp(rawPattern));
    } catch (error) {
      console.error(`Invalid CORS origin regex pattern skipped: ${rawPattern}`, error);
    }
    return patterns;
  }, []);

const unique = values => Array.from(new Set(values.filter(Boolean)));

const toOrigin = value => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch (error) {
    return value;
  }
};

const normalizeTrustProxyValue = value => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'false') return false;
  if (lower === 'true') return 1;
  if (lower === 'loopback' || lower === 'localhost') return lower;

  const numeric = Number.parseInt(trimmed, 10);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return trimmed;
};

const defaultOriginsByEnvironment = {
  development: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173'
  ],
  test: ['http://localhost:4173'],
  production: [
    'https://sesimiz-ol.com',
    'https://www.sesimiz-ol.com',
    'https://sesimiz-ol.firebaseapp.com',
    'https://sesimiz-ol.web.app'
  ]
};

const baseOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? parseList(process.env.CORS_ALLOWED_ORIGINS)
  : [];

const environmentOrigins = (() => {
  const key = `CORS_ALLOWED_ORIGINS_${currentEnvironment.toUpperCase()}`;
  return process.env[key] ? parseList(process.env[key]) : [];
})();

const explicitOrigins = Array.from(
  new Set([
    ...(defaultOriginsByEnvironment[currentEnvironment] || []),
    ...baseOrigins,
    ...environmentOrigins
  ])
);

const regexOrigins = process.env.CORS_ALLOWED_ORIGIN_REGEX
  ? buildRegexList(process.env.CORS_ALLOWED_ORIGIN_REGEX)
  : [];

const buildCspDirectives = () => {
  const scriptSrc = ["'self'"].concat(
    currentEnvironment !== 'production' ? ["'unsafe-inline'", "'unsafe-eval'"] : []
  );

  const styleSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com'
  ];

  const fontSrc = ["'self'", 'https://fonts.gstatic.com'];

  const connectSrc = [
    "'self'",
    ...explicitOrigins,
    toOrigin(process.env.BACKEND_URL),
    toOrigin(process.env.FRONTEND_URL),
    toOrigin(process.env.API_BASE_URL)
  ];

  if (currentEnvironment !== 'production') {
    connectSrc.push(
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'ws://localhost:5173',
      'ws://127.0.0.1:5173'
    );
  }

  const directives = {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
    fontSrc,
    styleSrc,
    scriptSrc,
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    connectSrc,
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    workerSrc: ["'self'", 'blob:'],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    childSrc: ["'self'"],
    manifestSrc: ["'self'"]
  };

  const applyEnvOverrides = (key, envVar) => {
    if (process.env[envVar]) {
      directives[key] = unique([
        ...directives[key],
        ...parseList(process.env[envVar])
      ]);
    } else {
      directives[key] = unique(directives[key]);
    }
  };

  applyEnvOverrides('scriptSrc', 'SECURITY_CSP_SCRIPT_SRC');
  applyEnvOverrides('styleSrc', 'SECURITY_CSP_STYLE_SRC');
  applyEnvOverrides('fontSrc', 'SECURITY_CSP_FONT_SRC');
  applyEnvOverrides('imgSrc', 'SECURITY_CSP_IMG_SRC');
  applyEnvOverrides('connectSrc', 'SECURITY_CSP_CONNECT_SRC');

  return directives;
};

const allowNullOrigin = (() => {
  if (process.env.CORS_ALLOW_NULL_ORIGIN === 'true') {
    return true;
  }

  if (process.env.CORS_ALLOW_NULL_ORIGIN === 'false') {
    return false;
  }

  return currentEnvironment !== 'production';
})();

const credentialsEnabled = (() => {
  if (process.env.CORS_CREDENTIALS === 'true') return true;
  if (process.env.CORS_CREDENTIALS === 'false') return false;
  return true;
})();

const securityHeadersEnabled = process.env.SECURITY_HEADERS_ENABLED !== 'false';
const securityHeadersReportOnly = process.env.SECURITY_HEADERS_REPORT_ONLY === 'true';
const trustProxySetting = normalizeTrustProxyValue(process.env.TRUST_PROXY);

if (typeof trustProxySetting !== 'undefined') {
  app.set('trust proxy', trustProxySetting);
} else if (process.env.RATE_LIMIT_ENABLED !== 'false') {
  app.set('trust proxy', 'loopback');
}

if (securityHeadersEnabled) {
  const contentSecurityPolicy = buildCspDirectives();
  app.use(helmet({
    contentSecurityPolicy: {
      directives: contentSecurityPolicy,
      reportOnly: securityHeadersReportOnly
    },
    crossOriginResourcePolicy: {
      policy: currentEnvironment === 'production' ? 'same-site' : 'cross-origin'
    },
    crossOriginOpenerPolicy: {
      policy: 'same-origin-allow-popups'
    },
    crossOriginEmbedderPolicy: false,
    dnsPrefetchControl: {
      allow: currentEnvironment !== 'production'
    },
    frameguard: {
      action: 'deny'
    },
    hidePoweredBy: true,
    hsts: currentEnvironment === 'production'
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },
    referrerPolicy: {
      policy: 'no-referrer'
    }
  }));
} else {
  console.warn('Security headers are disabled via SECURITY_HEADERS_ENABLED environment flag.');
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      if (allowNullOrigin) {
        return callback(null, true);
      }

      return callback(new Error('Origin header is required by CORS policy.'));
    }

    if (explicitOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (regexOrigins.some(pattern => pattern.test(origin))) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin (${currentEnvironment}): ${origin}`);
    return callback(new Error(`Origin ${origin} is not allowed by the configured CORS policy.`));
  },
  credentials: credentialsEnabled,
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

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const tags = {
      method: req.method,
      status: res.statusCode,
      route: req.route?.path || req.originalUrl
    };
    recordSecurityMetric('http_request_total', 1, tags);
    recordSecurityMetric('http_request_duration_ms', durationMs, tags);
  });
  next();
});

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
      'GET /api/users/settings - Get user settings',
      'PUT /api/users/settings - Update user settings',
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

const mountApiRoutes = (router) => {
  router.use('/auth', authRoutes);
  router.use('/upload', uploadRoutes);
  router.use('/users', userRoutes);
  router.use('/stories', storyRoutes);
  router.use('/admin', adminRoutes);
  router.use('/messages', messageRoutes);
  router.use('/comments', commentRoutes);
  router.use('/activity', activityRoutes);
  return router;
};

const apiRouter = mountApiRoutes(express.Router());
const apiV1Router = mountApiRoutes(express.Router());

app.use('/api', apiRouter);
app.use('/api/v1', apiV1Router);

app.get(['/api', '/api/v1'], (req, res) => {
  res.json({ 
    message: 'Sesimiz Ol API Server',
    version: '2.0.0',
    endpoints: [
      // Authentication
      'POST /api/v1/auth/register - Register new user',
      'POST /api/v1/auth/login - Login user',
      'POST /api/v1/auth/refresh - Refresh token',
      'GET /api/v1/auth/profile - Get user profile',
      'PUT /api/v1/auth/profile - Update profile',
      'PUT /api/v1/auth/password - Change password',
      // Stories
      'GET /api/v1/stories - List all stories',
      'GET /api/v1/stories/:id - Get story details',
      'POST /api/v1/stories/:id/view - Increment view count',
      'POST /api/v1/stories - Create new story',
      // Upload
      'POST /api/v1/upload/avatar - Upload avatar',
      'GET /uploads/avatars/:filename - Get avatar file',
      // Legacy
      'POST /api/v1/users - Create user',
      'GET /api/v1/users/settings - Get user settings',
      'PUT /api/v1/users/settings - Update user settings',
      'GET /api/v1/users/:id - Get user profile'
    ]
  });
});

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

refreshFeatureFlags({ force: true }).catch((error) => {
  console.error('Failed to load feature flags', error);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});

export default app;
