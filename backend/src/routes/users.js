import express from 'express';
import {
  createUser,
  getUserProfile,
  updateUserProfile,
  getUserStories,
} from '../controllers/userController.js';
import {
  getUserSettings,
  updateUserSettings,
  updateSettingsValidation,
} from '../controllers/userSettingsController.js';
import { authenticateToken } from '../middleware/auth.js';
import { csrfMiddleware } from '../utils/csrf.js';

const router = express.Router();

// POST /api/users - Create new user (registration)
router.post('/', createUser);

// GET /api/users/settings - Get authenticated user settings
router.get('/settings', authenticateToken, getUserSettings);

// PUT /api/users/settings - Update authenticated user settings
router.put(
  '/settings',
  authenticateToken,
  csrfMiddleware,
  updateSettingsValidation,
  updateUserSettings
);

// GET /api/users/:id - Get user profile
router.get('/:id', getUserProfile);

// PUT /api/users/:id - Update user profile
router.put('/:id', updateUserProfile);

// GET /api/users/:id/stories - Get user's stories
router.get('/:id/stories', getUserStories);

export default router;
