const coerceBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return false;
};

const staticFlags = {
  messaging: coerceBoolean(process.env.FEATURE_MESSAGING_ENABLED),
  adminPanel: coerceBoolean(process.env.FEATURE_ADMIN_PANEL_ENABLED),
  emailNotifications: coerceBoolean(process.env.FEATURE_EMAIL_NOTIFICATIONS),
  migrationMode: coerceBoolean(process.env.FEATURE_MIGRATION_MODE)
};

const overrides = new Map();

export const isFeatureEnabled = (flag) => {
  if (overrides.has(flag)) {
    return overrides.get(flag);
  }
  return staticFlags[flag] ?? false;
};

export const setFeatureOverride = (flag, value) => {
  overrides.set(flag, Boolean(value));
};

export const clearFeatureOverride = (flag) => {
  overrides.delete(flag);
};

export const listFeatureFlags = () => ({
  ...staticFlags,
  overrides: Object.fromEntries(overrides.entries())
});

export default {
  isFeatureEnabled,
  setFeatureOverride,
  clearFeatureOverride,
  listFeatureFlags
};
