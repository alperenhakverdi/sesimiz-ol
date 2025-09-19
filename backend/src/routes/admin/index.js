import express from 'express';
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

const router = express.Router();

router.use(requireFeature('adminPanel'));
router.use(requireRole('ADMIN'));

router.get('/users', listUsersValidation, listAdminUsers);
router.post('/users', createAdminUserValidation, createAdminUser);
router.put('/users/:id', updateAdminUserValidation, updateAdminUser);
router.post('/users/:id/ban', toggleUserBan);
router.post('/users/:id/role', updateUserRoleValidation, updateUserRole);

router.get('/feature-flags', listFeatureFlagsValidation, listFeatureFlagsController);
router.patch('/feature-flags/:key', updateFeatureFlagValidation, updateFeatureFlagController);

export default router;
