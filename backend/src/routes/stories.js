import express from 'express';
import { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory,
  incrementViewCount 
} from '../controllers/storyFirebaseController.js';
import { authenticateToken } from '../middleware/auth.js';
import { csrfMiddleware } from '../utils/csrf.js';

const router = express.Router();

// GET /api/stories - List all stories (public)
router.get('/', getAllStories);

// GET /api/stories/:id - Get story details
router.get('/:id', getStoryById);

// POST /api/stories/:id/view - Increment view count
router.post('/:id/view', incrementViewCount);

// POST /api/stories - Create new story (requires authentication)
router.post('/', authenticateToken, csrfMiddleware, createStory);

// PUT /api/stories/:id - Update story (author only)
router.put('/:id', authenticateToken, csrfMiddleware, updateStory);

// DELETE /api/stories/:id - Delete story (author only)  
router.delete('/:id', authenticateToken, csrfMiddleware, deleteStory);

export default router;
