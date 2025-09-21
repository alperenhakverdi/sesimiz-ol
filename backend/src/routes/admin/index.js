import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireFeature, requireRole } from '../../middleware/authorization.js';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  toggleUserBan,
  updateUserRole,
  listUsersValidation,
  createAdminUserValidation,
  updateAdminUserValidation,
  updateUserRoleValidation
} from '../../controllers/adminUserController.js';
import {
  listFeatureFlagsValidation,
  listFeatureFlagsController,
  updateFeatureFlagValidation,
  updateFeatureFlagController
} from '../../controllers/featureFlagController.js';
import { getMetrics } from '../../controllers/adminMetricsController.js';
import {
  listAdminStories,
  approveStory,
  rejectStory,
  deleteStory
} from '../../controllers/adminStoryController.js';

const router = express.Router();

// First authenticate the user, then check admin role
router.use(authenticateToken);
router.use(requireFeature('adminPanel'));
router.use(requireRole('ADMIN'));

// User management routes
router.get('/users', listUsersValidation, listAdminUsers);
router.post('/users', createAdminUserValidation, createAdminUser);
router.put('/users/:id', updateAdminUserValidation, updateAdminUser);
router.post('/users/:id/ban', toggleUserBan);
router.post('/users/:id/role', updateUserRoleValidation, updateUserRole);

// Feature flags routes
router.get('/feature-flags', listFeatureFlagsValidation, listFeatureFlagsController);
router.patch('/feature-flags/:key', updateFeatureFlagValidation, updateFeatureFlagController);

// Story moderation routes
router.get('/stories', listAdminStories);
router.post('/stories/:id/approve', approveStory);
router.post('/stories/:id/reject', rejectStory);
router.delete('/stories/:id', deleteStory);

// Admin metrics endpoint
router.get('/metrics', getMetrics);

export default router;