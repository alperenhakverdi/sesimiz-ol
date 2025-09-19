const rolePermissions = {
  USER: new Set([]),
  MODERATOR: new Set(['users:read', 'stories:review']),
  ADMIN: new Set([
    'users:read',
    'users:write',
    'stories:review',
    'stories:delete',
    'organizations:manage',
    'announcements:manage'
  ])
};

export const hasPermission = (user, permission) => {
  if (!user) return false;
  const roleSet = rolePermissions[user.role] || new Set();
  return roleSet.has(permission);
};

export const requirePermissionCheck = (permission) => (user) => hasPermission(user, permission);

export const listPermissionsForRole = (role) => Array.from(rolePermissions[role] || []);

export const addPermissionToRole = (role, permission) => {
  if (!rolePermissions[role]) {
    rolePermissions[role] = new Set();
  }
  rolePermissions[role].add(permission);
};

export default {
  hasPermission,
  requirePermissionCheck,
  listPermissionsForRole,
  addPermissionToRole
};
