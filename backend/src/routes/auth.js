import express from 'express';
import rateLimit from 'express-rate-limit';
import { 
  register, 
  login, 
  refreshToken, 
  getProfile, 
  updateProfile, 
  changePassword, 
  deactivateAccount,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} from '../controllers/authController.js';
import { 
  authenticateToken, 
  refreshTokenMiddleware 
} from '../middleware/auth.js';
import { 
  avatarUpload, 
  processAvatar, 
  handleUploadError 
} from '../middleware/upload.js';

const router = express.Router();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
router.use(generalLimiter);

// POST /api/auth/register - Register new user
router.post('/register', 
  authLimiter,
  avatarUpload.single('avatar'),
  processAvatar,
  registerValidation,
  register,
  handleUploadError
);

// POST /api/auth/login - Login user
router.post('/login', 
  authLimiter,
  loginValidation,
  login
);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', 
  refreshTokenMiddleware,
  refreshToken
);

// GET /api/auth/profile - Get current user profile
router.get('/profile', 
  authenticateToken,
  getProfile
);

// PUT /api/auth/profile - Update user profile
router.put('/profile', 
  authenticateToken,
  avatarUpload.single('avatar'),
  processAvatar,
  updateProfileValidation,
  updateProfile,
  handleUploadError
);

// PUT /api/auth/password - Change password
router.put('/password', 
  authenticateToken,
  changePasswordValidation,
  changePassword
);

// DELETE /api/auth/account - Deactivate account
router.delete('/account', 
  authenticateToken,
  deactivateAccount
);

// GET /api/auth/check - Check if user is authenticated (for frontend)
router.get('/check', 
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: req.user
      }
    });
  }
);

export default router;