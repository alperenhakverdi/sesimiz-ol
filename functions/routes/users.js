import express from 'express';
import { 
  createUser, 
  getUserProfile, 
  updateUserProfile, 
  getUserStories 
} from '../controllers/userController.js';

const router = express.Router();

// POST /api/users - Create new user (registration)
router.post('/', createUser);

// GET /api/users/:id - Get user profile
router.get('/:id', getUserProfile);

// PUT /api/users/:id - Update user profile
router.put('/:id', updateUserProfile);

// GET /api/users/:id/stories - Get user's stories
router.get('/:id/stories', getUserStories);

export default router;