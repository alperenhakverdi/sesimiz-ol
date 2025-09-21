import express from 'express'
import {
  getOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats
} from '../controllers/organizationController.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/authorization.js'

const router = express.Router()

// Public routes
router.get('/', getOrganizations)
router.get('/stats', getOrganizationStats)
router.get('/:slug', getOrganization)

// Admin routes
router.post('/', authenticateToken, requireRole('ADMIN'), createOrganization)
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateOrganization)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteOrganization)

export default router