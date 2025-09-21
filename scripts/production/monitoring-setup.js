/**
 * Monitoring and Alerting Setup
 */

// Health check endpoint
const healthCheck = `
// Health check routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    res.status(200).json({ status: 'Ready' });
  } catch (error) {
    res.status(503).json({ status: 'Not Ready', error: error.message });
  }
});
`;

// Monitoring dashboard
const monitoringDashboard = `
const express = require('express');
const app = express();

// Simple monitoring dashboard
app.get('/monitor', (req, res) => {
  const stats = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  };

  res.json(stats);
});

app.listen(3030, () => {
  console.log('Monitoring dashboard: http://localhost:3030/monitor');
});
`;

console.log('📊 Monitoring and alerting setup ready');

module.exports = { healthCheck, monitoringDashboard };