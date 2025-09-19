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
  changePasswordValidation,
  issueCsrfToken,
  logout,
  logoutAll
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
import { csrfMiddleware } from '../utils/csrf.js';

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

// GET /api/auth/csrf - Issue CSRF token (placeholder; real logic in Phase 2.1.6)
router.get('/csrf', issueCsrfToken);

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
  csrfMiddleware,
  avatarUpload.single('avatar'),
  processAvatar,
  updateProfileValidation,
  updateProfile,
  handleUploadError
);

// PUT /api/auth/password - Change password
router.put('/password', 
  authenticateToken,
  csrfMiddleware,
  changePasswordValidation,
  changePassword
);

// DELETE /api/auth/account - Deactivate account
router.delete('/account', 
  authenticateToken,
  csrfMiddleware,
  deactivateAccount
);

// POST /api/auth/logout - Logout current session (placeholder)
router.post('/logout',
  authenticateToken,
  csrfMiddleware,
  logout
);

// POST /api/auth/logout-all - Logout all sessions (placeholder)
router.post('/logout-all',
  authenticateToken,
  csrfMiddleware,
  logoutAll
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
