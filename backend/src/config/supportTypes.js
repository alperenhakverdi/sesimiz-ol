export const SUPPORT_TYPES = Object.freeze(['HEART', 'HUG', 'CLAP', 'CARE']);
export const DEFAULT_SUPPORT_TYPE = 'HEART';

export const isSupportType = (value) => {
  if (!value) return false;
  return SUPPORT_TYPES.includes(String(value).toUpperCase());
};

export const normalizeSupportType = (value) => {
  if (!value) return DEFAULT_SUPPORT_TYPE;
  const upper = String(value).toUpperCase();
  return isSupportType(upper) ? upper : DEFAULT_SUPPORT_TYPE;
};
