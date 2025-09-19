import { PrismaClient } from '@prisma/client';
import logSecurityEvent from './securityLogger.js';

const prisma = new PrismaClient();

const coerceBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return fallback;
};

const flagDefaults = {
  messaging: {
    name: 'Messaging Experience',
    description: 'Kullanıcı mesajlaşma ve sesli paylaşım özelliklerini etkinleştirir.',
    default: coerceBoolean(process.env.FEATURE_MESSAGING_ENABLED)
  },
  adminPanel: {
    name: 'Admin Panel',
    description: 'Yalnızca yönetici paneli arayüzünü ve API uçlarını açar.',
    default: coerceBoolean(process.env.FEATURE_ADMIN_PANEL_ENABLED)
  },
  emailNotifications: {
    name: 'E-posta Bildirimleri',
    description: 'Sistem ve güvenlik e-posta bildirimlerini aktif eder.',
    default: coerceBoolean(process.env.FEATURE_EMAIL_NOTIFICATIONS)
  },
  migrationMode: {
    name: 'Migration Mode',
    description: 'Kademeli geçiş/dönüş senaryoları için yeni altyapıyı devreye alır.',
    default: coerceBoolean(process.env.FEATURE_MIGRATION_MODE)
  },
  passwordResetV2: {
    name: 'Password Reset V2',
    description: 'Yeni OTP tabanlı şifre sıfırlama akışını etkinleştirir.',
    default: true
  },
  authLegacySessions: {
    name: 'Legacy Auth Coexistence',
    description: 'Yeni oturum yönetimi devredeyken legacy oturum/çerez kontrolünü aktif tutar.',
    default: true
  }
};

const overrides = new Map();
let cachedFlags = new Map();
let cachedMetadata = new Map();
let lastRefreshedAt = 0;

const REFRESH_INTERVAL_MS = Number(process.env.FEATURE_FLAG_REFRESH_INTERVAL_MS || 300000);

const getDefaultValue = (key) => {
  const flag = flagDefaults[key];
  if (!flag) {
    return false;
  }
  return coerceBoolean(flag.default);
};

const normaliseMetadata = (record) => ({
  key: record.key,
  name: record.name ?? record.key,
  description: record.description ?? flagDefaults[record.key]?.description ?? null,
  enabled: record.enabled,
  rolloutStatus: record.rolloutStatus ?? null,
  metadata: record.metadata ?? null,
  lastChangedAt: record.lastChangedAt ?? null,
  lastChangedById: record.lastChangedById ?? null,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt
});

const ensureDefaultRecords = async (recordsByKey) => {
  const missingKeys = Object.keys(flagDefaults).filter((key) => !recordsByKey.has(key));

  if (missingKeys.length === 0) {
    return;
  }

  for (const key of missingKeys) {
    const config = flagDefaults[key];
    const created = await prisma.featureFlag.create({
      data: {
        key,
        name: config.name ?? key,
        description: config.description ?? null,
        enabled: coerceBoolean(config.default),
        rolloutStatus: config.rolloutStatus ?? null,
        metadata: config.metadata ?? null
      }
    });
    recordsByKey.set(key, created);
  }
};

export const refreshFeatureFlags = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && cachedFlags.size && now - lastRefreshedAt < REFRESH_INTERVAL_MS) {
    return cachedFlags;
  }

  const records = await prisma.featureFlag.findMany();
  const recordsByKey = new Map(records.map((record) => [record.key, record]));

  await ensureDefaultRecords(recordsByKey);

  cachedFlags = new Map();
  cachedMetadata = new Map();

  for (const [key, record] of recordsByKey.entries()) {
    cachedFlags.set(key, record.enabled);
    cachedMetadata.set(key, record);
  }

  for (const [key] of Object.entries(flagDefaults)) {
    if (!cachedFlags.has(key)) {
      cachedFlags.set(key, getDefaultValue(key));
    }
  }

  lastRefreshedAt = now;
  return cachedFlags;
};

export const isFeatureEnabled = (flag) => {
  if (overrides.has(flag)) {
    return overrides.get(flag);
  }

  if (cachedFlags.has(flag)) {
    return cachedFlags.get(flag);
  }

  const defaultValue = getDefaultValue(flag);
  cachedFlags.set(flag, defaultValue);
  return defaultValue;
};

export const setFeatureOverride = (flag, value) => {
  overrides.set(flag, Boolean(value));
};

export const clearFeatureOverride = (flag) => {
  overrides.delete(flag);
};

export const listFeatureFlags = async () => {
  await refreshFeatureFlags();

  const response = [];
  const seen = new Set();

  for (const [key, record] of cachedMetadata.entries()) {
    response.push(normaliseMetadata(record));
    seen.add(key);
  }

  cachedFlags.forEach((enabled, key) => {
    if (seen.has(key)) return;
    response.push({
      key,
      name: flagDefaults[key]?.name ?? key,
      description: flagDefaults[key]?.description ?? null,
      enabled,
      rolloutStatus: flagDefaults[key]?.rolloutStatus ?? null,
      metadata: flagDefaults[key]?.metadata ?? null,
      lastChangedAt: null,
      lastChangedById: null,
      createdAt: null,
      updatedAt: null
    });
    seen.add(key);
  });

  response.sort((a, b) => a.key.localeCompare(b.key));
  return response;
};

export const getFeatureFlag = async (key) => {
  await refreshFeatureFlags();
  const record = cachedMetadata.get(key);
  if (record) {
    return normaliseMetadata(record);
  }

  if (flagDefaults[key]) {
    return {
      key,
      name: flagDefaults[key].name ?? key,
      description: flagDefaults[key].description ?? null,
      enabled: cachedFlags.get(key) ?? getDefaultValue(key),
      rolloutStatus: flagDefaults[key].rolloutStatus ?? null,
      metadata: flagDefaults[key].metadata ?? null,
      lastChangedAt: null,
      lastChangedById: null,
      createdAt: null,
      updatedAt: null
    };
  }

  return null;
};

export const updateFeatureFlag = async ({
  key,
  enabled,
  rolloutStatus,
  description,
  metadata,
  userId
}) => {
  const data = {};
  if (typeof enabled !== 'undefined') {
    data.enabled = Boolean(enabled);
  }
  if (typeof rolloutStatus !== 'undefined') {
    data.rolloutStatus = rolloutStatus ?? null;
  }
  if (typeof description !== 'undefined') {
    data.description = description ?? null;
  }
  if (typeof metadata !== 'undefined') {
    data.metadata = metadata ?? null;
  }

  data.lastChangedById = userId ?? null;
  data.lastChangedAt = new Date();

  let record;
  if (cachedMetadata.has(key)) {
    record = await prisma.featureFlag.update({
      where: { key },
      data
    });
  } else {
    record = await prisma.featureFlag.create({
      data: {
        key,
        name: flagDefaults[key]?.name ?? key,
        description: typeof description !== 'undefined' ? description ?? null : flagDefaults[key]?.description ?? null,
        enabled: typeof enabled !== 'undefined' ? Boolean(enabled) : getDefaultValue(key),
        rolloutStatus: typeof rolloutStatus !== 'undefined' ? rolloutStatus ?? null : flagDefaults[key]?.rolloutStatus ?? null,
        metadata: typeof metadata !== 'undefined' ? metadata ?? null : flagDefaults[key]?.metadata ?? null,
        lastChangedById: userId ?? null,
        lastChangedAt: data.lastChangedAt
      }
    });
  }

  overrides.delete(key);
  await refreshFeatureFlags({ force: true });

  logSecurityEvent({
    event: 'FEATURE_FLAG_UPDATED',
    userId: userId ?? null,
    ip: null,
    meta: {
      key,
      enabled: record.enabled,
      rolloutStatus: record.rolloutStatus ?? null
    }
  });

  return normaliseMetadata(record);
};

export const listFeatureFlagDefaults = () => flagDefaults;

export default {
  refreshFeatureFlags,
  isFeatureEnabled,
  setFeatureOverride,
  clearFeatureOverride,
  listFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
  listFeatureFlagDefaults
};
