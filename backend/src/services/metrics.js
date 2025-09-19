const metricsEnabled = process.env.METRICS_ENABLED === 'true';
const namespace = process.env.METRICS_NAMESPACE || 'sesimiz_ol';

export const recordSecurityMetric = (name, value = 1, tags = {}) => {
  if (!metricsEnabled) {
    return;
  }

  const tagString = Object.entries(tags)
    .map(([key, tagValue]) => `${key}=${tagValue}`)
    .join(',');

  // Placeholder implementation. Replace with StatsD, Prometheus, etc.
  // eslint-disable-next-line no-console
  console.info(`[metric] ${namespace}.${name} value=${value}${tagString ? ` tags=${tagString}` : ''}`);
};

export default {
  recordSecurityMetric
};
