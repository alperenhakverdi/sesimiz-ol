import express from 'express'
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementStats
} from '../controllers/announcementController.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/authorization.js'

const router = express.Router()

// Public routes
router.get('/', getAnnouncements)
router.get('/stats', getAnnouncementStats)
router.get('/:id', getAnnouncement)

// Admin routes
router.post('/', authenticateToken, requireRole('ADMIN'), createAnnouncement)
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateAnnouncement)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteAnnouncement)

export default router
