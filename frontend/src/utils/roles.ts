export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  DEVELOPER: 'dev',
};

export const PERMISSIONS = {
  CAN_MANAGE_USERS: 'can_manage_users',
  CAN_MANAGE_PROJECTS: 'can_manage_projects',
  CAN_VIEW_ASSIGNED_PROJECTS: 'can_view_assigned_projects',
};

export const rolePermissions = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CAN_MANAGE_USERS,
    PERMISSIONS.CAN_MANAGE_PROJECTS, // admins can also manage projects for dev testing
    PERMISSIONS.CAN_VIEW_ASSIGNED_PROJECTS,
  ],
  [ROLES.OWNER]: [
    PERMISSIONS.CAN_MANAGE_PROJECTS,
    PERMISSIONS.CAN_VIEW_ASSIGNED_PROJECTS,
  ],
  [ROLES.DEVELOPER]: [
    PERMISSIONS.CAN_VIEW_ASSIGNED_PROJECTS,
  ],
};

export const hasPermission = (userRole: string, permission: string): boolean => {
  const permissions = rolePermissions[userRole as keyof typeof rolePermissions];
  return permissions ? permissions.includes(permission) : false;
};
