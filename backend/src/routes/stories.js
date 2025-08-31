import express from 'express';
import { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory,
  incrementViewCount 
} from '../controllers/storyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stories - List all stories (public)
router.get('/', getAllStories);

// GET /api/stories/:id - Get story details
router.get('/:id', getStoryById);

// POST /api/stories/:id/view - Increment view count
router.post('/:id/view', incrementViewCount);

// POST /api/stories - Create new story (requires authentication)
router.post('/', authenticateToken, createStory);

// PUT /api/stories/:id - Update story (author only)
router.put('/:id', authenticateToken, updateStory);

// DELETE /api/stories/:id - Delete story (author only)  
router.delete('/:id', authenticateToken, deleteStory);

export default router;