import pino from 'pino';
import { recordSecurityMetric } from './metrics.js';

const channel = process.env.SECURITY_EVENT_LOG_CHANNEL || 'security';
const level = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level,
  base: undefined,
  name: channel
});

/**
 * Logs a structured security event.
 *
 * @param {Object} event - Security event data
 * @param {string} event.event - Event name (e.g., LOGIN_SUCCESS)
 * @param {number|undefined} event.userId - Related user id if available
 * @param {string|undefined} event.ip - Remote IP address
 * @param {Object|undefined} event.meta - Additional metadata
 * @param {string|undefined} event.message - Human-readable message
 */
export const logSecurityEvent = ({ event, userId, ip, meta, message }) => {
  logger.info({
    event,
    userId,
    ip,
    meta
  }, message || event);

  recordSecurityMetric(event, 1, {
    userId: userId ?? 'anonymous'
  });
};

export default logSecurityEvent;
