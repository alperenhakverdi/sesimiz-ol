const UNIT_MAP = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000
};

export const parseDurationToMs = (value, fallbackMs) => {
  if (!value && fallbackMs) {
    return fallbackMs;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return fallbackMs ?? 0;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const match = /^\s*(\d+(?:\.\d+)?)(ms|s|m|h|d|w)\s*$/i.exec(value);
  if (!match) {
    return fallbackMs ?? 0;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = UNIT_MAP[unit];
  return Math.round(amount * multiplier);
};

export const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000);
export const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);
export const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
