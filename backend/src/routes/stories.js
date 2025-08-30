import express from 'express';
import { 
  getAllStories, 
  getStoryById, 
  createStory, 
  updateStory, 
  deleteStory 
} from '../controllers/storyController.js';

const router = express.Router();

// GET /api/stories - List all stories (public)
router.get('/', getAllStories);

// GET /api/stories/:id - Get story details
router.get('/:id', getStoryById);

// POST /api/stories - Create new story
router.post('/', createStory);

// PUT /api/stories/:id - Update story (author only)
router.put('/:id', updateStory);

// DELETE /api/stories/:id - Delete story (author only)
router.delete('/:id', deleteStory);

export default router;