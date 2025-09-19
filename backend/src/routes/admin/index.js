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

const router = express.Router();

router.use(requireFeature('adminPanel'));
router.use(requireRole('ADMIN'));

router.get('/users', listUsersValidation, listAdminUsers);
router.post('/users', createAdminUserValidation, createAdminUser);
router.put('/users/:id', updateAdminUserValidation, updateAdminUser);
router.post('/users/:id/ban', toggleUserBan);
router.post('/users/:id/role', updateUserRoleValidation, updateUserRole);

export default router;
