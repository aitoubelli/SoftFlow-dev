import { hasPermission, ROLES, PERMISSIONS } from './roles';

describe('hasPermission', () => {
  it('returns true if role has the permission', () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.CAN_MANAGE_USERS)).toBe(true);
    expect(hasPermission(ROLES.OWNER, PERMISSIONS.CAN_MANAGE_PROJECTS)).toBe(true);
    expect(hasPermission(ROLES.DEVELOPER, PERMISSIONS.CAN_VIEW_ASSIGNED_PROJECTS)).toBe(true);
  });

  it('returns false if role does not have the permission', () => {
    expect(hasPermission(ROLES.DEVELOPER, PERMISSIONS.CAN_MANAGE_USERS)).toBe(false);
    expect(hasPermission(ROLES.OWNER, PERMISSIONS.CAN_MANAGE_USERS)).toBe(false);
  });

  it('returns false for unknown role', () => {
    expect(hasPermission('unknown', PERMISSIONS.CAN_MANAGE_USERS)).toBe(false);
  });

  it('returns false for unknown permission', () => {
    expect(hasPermission(ROLES.ADMIN, 'unknown')).toBe(false);
  });
});
