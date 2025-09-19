import express from 'express';
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
import { authRateLimiter, generalRateLimiter } from '../config/rateLimit.js';

const router = express.Router();

// Apply general rate limiting to all routes
router.use(generalRateLimiter);

// POST /api/auth/register - Register new user
router.post('/register', 
  authRateLimiter,
  avatarUpload.single('avatar'),
  processAvatar,
  registerValidation,
  register,
  handleUploadError
);

// POST /api/auth/login - Login user
router.post('/login', 
  authRateLimiter,
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

