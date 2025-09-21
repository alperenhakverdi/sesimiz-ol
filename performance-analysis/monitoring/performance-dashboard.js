#!/usr/bin/env node

/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics collection and monitoring
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceDashboard {
  constructor(port = 3030) {
    this.port = port;
    this.metrics = {
      requests: [],
      errors: [],
      performance: [],
      health: [],
      system: []
    };
    this.collectors = [];
    this.alertRules = [];
    this.isRunning = false;
    this.startTime = Date.now();
  }

  // Initialize dashboard with default collectors
  async initialize() {
    console.log('🚀 Initializing Performance Dashboard...');

    // Setup default collectors
    this.setupSystemMetricsCollector();
    this.setupAPIHealthCollector();
    this.setupDatabaseMetricsCollector();

    // Setup default alert rules
    this.setupDefaultAlertRules();

    console.log('✅ Performance Dashboard initialized');
  }

  // System metrics collector
  setupSystemMetricsCollector() {
    const collector = {
      name: 'system_metrics',
      interval: 5000, // 5 seconds
      collect: () => {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        return {
          timestamp: Date.now(),
          memory: {
            rss: memUsage.rss,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          uptime: process.uptime(),
          loadAverage: process.platform === 'win32' ? [0, 0, 0] : [1, 1, 1] // Simplified for cross-platform
        };
      }
    };

    this.addCollector(collector);
  }

  // API health collector
  setupAPIHealthCollector() {
    const baseURL = process.env.API_BASE_URL || 'http://localhost:3001';

    const collector = {
      name: 'api_health',
      interval: 30000, // 30 seconds
      collect: async () => {
        const endpoints = [
          '/health',
          '/api/stories',
          '/api/stories/categories'
        ];

        const results = [];

        for (const endpoint of endpoints) {
          const start = performance.now();
          try {
            const response = await this.makeHealthRequest(`${baseURL}${endpoint}`);
            const duration = performance.now() - start;

            results.push({
              endpoint,
              status: 'UP',
              responseTime: Math.round(duration * 100) / 100,
              statusCode: response.statusCode,
              timestamp: Date.now()
            });
          } catch (error) {
            results.push({
              endpoint,
              status: 'DOWN',
              error: error.message,
              timestamp: Date.now()
            });
          }
        }

        return {
          timestamp: Date.now(),
          endpoints: results,
          overallStatus: results.every(r => r.status === 'UP') ? 'HEALTHY' : 'UNHEALTHY'
        };
      }
    };

    this.addCollector(collector);
  }

  // Database metrics collector (if accessible)
  setupDatabaseMetricsCollector() {
    const collector = {
      name: 'database_metrics',
      interval: 60000, // 1 minute
      collect: async () => {
        try {
          // This would require database access
          // For now, we'll return mock metrics
          return {
            timestamp: Date.now(),
            connectionPool: {
              active: Math.floor(Math.random() * 10),
              idle: Math.floor(Math.random() * 5),
              total: 15
            },
            queries: {
              avgResponseTime: Math.random() * 100 + 50,
              queriesPerSecond: Math.random() * 50 + 10,
              slowQueries: Math.floor(Math.random() * 3)
            },
            status: 'CONNECTED'
          };
        } catch (error) {
          return {
            timestamp: Date.now(),
            status: 'ERROR',
            error: error.message
          };
        }
      }
    };

    this.addCollector(collector);
  }

  // Setup default alert rules
  setupDefaultAlertRules() {
    this.alertRules = [
      {
        name: 'High Memory Usage',
        condition: (metrics) => {
          const latest = this.getLatestSystemMetrics();
          return latest && (latest.memory.heapUsed / latest.memory.heapTotal) > 0.85;
        },
        severity: 'WARNING',
        message: 'Memory usage is above 85%'
      },
      {
        name: 'API Health Check Failed',
        condition: (metrics) => {
          const latest = this.getLatestHealthMetrics();
          return latest && latest.overallStatus === 'UNHEALTHY';
        },
        severity: 'CRITICAL',
        message: 'API health check failed'
      },
      {
        name: 'High Response Time',
        condition: (metrics) => {
          const latest = this.getLatestHealthMetrics();
          if (!latest || !latest.endpoints) return false;

          return latest.endpoints.some(endpoint =>
            endpoint.responseTime && endpoint.responseTime > 1000
          );
        },
        severity: 'WARNING',
        message: 'API response time is above 1000ms'
      },
      {
        name: 'Database Connection Issues',
        condition: (metrics) => {
          const latest = this.getLatestDatabaseMetrics();
          return latest && latest.status === 'ERROR';
        },
        severity: 'CRITICAL',
        message: 'Database connection issues detected'
      }
    ];
  }

  // Add a metrics collector
  addCollector(collector) {
    this.collectors.push(collector);
    console.log(`📊 Added collector: ${collector.name}`);
  }

  // Start the dashboard
  async start() {
    console.log(`🌐 Starting Performance Dashboard on port ${this.port}...`);

    // Start metrics collection
    this.startMetricsCollection();

    // Create HTTP server for dashboard
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, () => {
      console.log(`✅ Performance Dashboard running at http://localhost:${this.port}`);
      console.log('📊 Available endpoints:');
      console.log(`   http://localhost:${this.port}/ - Dashboard UI`);
      console.log(`   http://localhost:${this.port}/api/metrics - Current metrics`);
      console.log(`   http://localhost:${this.port}/api/health - Health status`);
      console.log(`   http://localhost:${this.port}/api/alerts - Active alerts`);
    });

    this.isRunning = true;
  }

  // Start metrics collection
  startMetricsCollection() {
    this.collectors.forEach(collector => {
      const intervalId = setInterval(async () => {
        try {
          const data = await collector.collect();
          this.recordMetric(collector.name, data);
        } catch (error) {
          console.error(`❌ Error collecting ${collector.name}:`, error.message);
        }
      }, collector.interval);

      collector.intervalId = intervalId;
    });

    // Start alert checking
    this.alertInterval = setInterval(() => {
      this.checkAlerts();
    }, 10000); // Check alerts every 10 seconds

    console.log('🔄 Metrics collection started');
  }

  // Record a metric
  recordMetric(type, data) {
    if (!this.metrics[type]) {
      this.metrics[type] = [];
    }

    this.metrics[type].push(data);

    // Keep only recent metrics (last 1000 entries)
    if (this.metrics[type].length > 1000) {
      this.metrics[type] = this.metrics[type].slice(-1000);
    }
  }

  // Check alert conditions
  checkAlerts() {
    const activeAlerts = [];

    this.alertRules.forEach(rule => {
      try {
        if (rule.condition(this.metrics)) {
          const alert = {
            name: rule.name,
            severity: rule.severity,
            message: rule.message,
            timestamp: Date.now(),
            id: `${rule.name}-${Date.now()}`
          };

          activeAlerts.push(alert);
          console.log(`🚨 ALERT [${alert.severity}]: ${alert.message}`);
        }
      } catch (error) {
        console.error(`❌ Error checking alert ${rule.name}:`, error.message);
      }
    });

    // Store recent alerts
    this.recentAlerts = activeAlerts;
  }

  // Handle HTTP requests
  async handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      switch (url.pathname) {
        case '/':
          await this.serveDashboardUI(res);
          break;
        case '/api/metrics':
          this.serveMetrics(res);
          break;
        case '/api/health':
          this.serveHealth(res);
          break;
        case '/api/alerts':
          this.serveAlerts(res);
          break;
        case '/api/summary':
          this.serveSummary(res);
          break;
        default:
          this.serve404(res);
      }
    } catch (error) {
      console.error('❌ Error handling request:', error);
      this.serveError(res, error);
    }
  }

  // Serve dashboard UI
  async serveDashboardUI(res) {
    const html = this.generateDashboardHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  // Generate dashboard HTML
  generateDashboardHTML() {
    const latestSystem = this.getLatestSystemMetrics();
    const latestHealth = this.getLatestHealthMetrics();
    const alerts = this.recentAlerts || [];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sesimiz Ol - Performance Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; margin-bottom: 10px; }
        .status-good { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
        .alert-critical { background: #fee2e2; border-left: 4px solid #ef4444; }
        .refresh-btn { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Sesimiz Ol Performance Dashboard</h1>
            <p>Real-time monitoring and performance metrics</p>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            <span class="timestamp">Last updated: ${new Date().toLocaleString()}</span>
        </div>

        ${alerts.length > 0 ? `
        <div class="metric-card">
            <h3>🚨 Active Alerts</h3>
            ${alerts.map(alert => `
                <div class="alert alert-${alert.severity.toLowerCase()}">
                    <strong>${alert.name}</strong>: ${alert.message}
                    <br><small>${new Date(alert.timestamp).toLocaleString()}</small>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">System Status</div>
                <div class="metric-value ${latestHealth?.overallStatus === 'HEALTHY' ? 'status-good' : 'status-error'}">
                    ${latestHealth?.overallStatus || 'UNKNOWN'}
                </div>
                <small>API Health: ${latestHealth?.endpoints?.length || 0} endpoints monitored</small>
            </div>

            <div class="metric-card">
                <div class="metric-label">Memory Usage</div>
                <div class="metric-value">
                    ${latestSystem ? Math.round(latestSystem.memory.heapUsed / 1024 / 1024) : 0} MB
                </div>
                <small>Heap: ${latestSystem ? Math.round((latestSystem.memory.heapUsed / latestSystem.memory.heapTotal) * 100) : 0}% used</small>
            </div>

            <div class="metric-card">
                <div class="metric-label">Uptime</div>
                <div class="metric-value">
                    ${Math.round((Date.now() - this.startTime) / 1000 / 60)} min
                </div>
                <small>Dashboard started: ${new Date(this.startTime).toLocaleString()}</small>
            </div>

            <div class="metric-card">
                <div class="metric-label">API Response Time</div>
                <div class="metric-value">
                    ${latestHealth?.endpoints ?
                      Math.round(latestHealth.endpoints.reduce((sum, ep) => sum + (ep.responseTime || 0), 0) / latestHealth.endpoints.length) : 0
                    } ms
                </div>
                <small>Average across all endpoints</small>
            </div>
        </div>

        <div class="metric-card" style="margin-top: 20px;">
            <h3>📡 API Endpoints Status</h3>
            ${latestHealth?.endpoints ? latestHealth.endpoints.map(endpoint => `
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e5e7eb;">
                    <span>${endpoint.endpoint}</span>
                    <span class="${endpoint.status === 'UP' ? 'status-good' : 'status-error'}">
                        ${endpoint.status} ${endpoint.responseTime ? `(${Math.round(endpoint.responseTime)}ms)` : ''}
                    </span>
                </div>
            `).join('') : '<p>No endpoint data available</p>'}
        </div>

        <div class="metric-card" style="margin-top: 20px;">
            <h3>🔗 API Endpoints</h3>
            <ul>
                <li><a href="/api/metrics" target="_blank">Real-time Metrics (JSON)</a></li>
                <li><a href="/api/health" target="_blank">Health Status (JSON)</a></li>
                <li><a href="/api/alerts" target="_blank">Active Alerts (JSON)</a></li>
                <li><a href="/api/summary" target="_blank">Performance Summary (JSON)</a></li>
            </ul>
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
    </script>
</body>
</html>`;
  }

  // Serve metrics endpoint
  serveMetrics(res) {
    const response = {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      metrics: this.metrics,
      collectors: this.collectors.map(c => ({
        name: c.name,
        interval: c.interval,
        lastCollection: this.getLatestMetric(c.name)?.timestamp
      }))
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response, null, 2));
  }

  // Serve health endpoint
  serveHealth(res) {
    const latest = this.getLatestHealthMetrics();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: latest?.overallStatus || 'UNKNOWN',
      timestamp: Date.now(),
      endpoints: latest?.endpoints || [],
      uptime: Date.now() - this.startTime
    }, null, 2));
  }

  // Serve alerts endpoint
  serveAlerts(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      alerts: this.recentAlerts || [],
      alertRules: this.alertRules.map(r => ({
        name: r.name,
        severity: r.severity,
        message: r.message
      })),
      timestamp: Date.now()
    }, null, 2));
  }

  // Serve summary endpoint
  serveSummary(res) {
    const system = this.getLatestSystemMetrics();
    const health = this.getLatestHealthMetrics();
    const database = this.getLatestDatabaseMetrics();

    const summary = {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      status: health?.overallStatus || 'UNKNOWN',
      performance: {
        memoryUsage: system ? Math.round((system.memory.heapUsed / system.memory.heapTotal) * 100) : 0,
        avgResponseTime: health?.endpoints ?
          Math.round(health.endpoints.reduce((sum, ep) => sum + (ep.responseTime || 0), 0) / health.endpoints.length) : 0,
        activeConnections: database?.connectionPool?.active || 0
      },
      alerts: {
        active: (this.recentAlerts || []).length,
        critical: (this.recentAlerts || []).filter(a => a.severity === 'CRITICAL').length
      },
      metrics: {
        dataPoints: Object.values(this.metrics).reduce((sum, arr) => sum + arr.length, 0),
        collectors: this.collectors.length
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(summary, null, 2));
  }

  // Serve 404
  serve404(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  // Serve error
  serveError(res, error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }

  // Helper methods
  getLatestMetric(type) {
    return this.metrics[type]?.slice(-1)[0] || null;
  }

  getLatestSystemMetrics() {
    return this.getLatestMetric('system_metrics');
  }

  getLatestHealthMetrics() {
    return this.getLatestMetric('api_health');
  }

  getLatestDatabaseMetrics() {
    return this.getLatestMetric('database_metrics');
  }

  // Make health check request
  async makeHealthRequest(url) {
    return new Promise((resolve, reject) => {
      const { protocol, hostname, port, pathname, search } = new URL(url);
      const options = {
        hostname,
        port: port || (protocol === 'https:' ? 443 : 80),
        path: pathname + search,
        method: 'GET',
        timeout: 5000,
        headers: {
          'User-Agent': 'PerformanceDashboard/1.0'
        }
      };

      const module = protocol === 'https:' ? require('https') : require('http');
      const req = module.request(options, (res) => {
        resolve({ statusCode: res.statusCode });
        res.resume(); // Consume response
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // Stop the dashboard
  async stop() {
    console.log('🛑 Stopping Performance Dashboard...');

    this.isRunning = false;

    // Clear intervals
    this.collectors.forEach(collector => {
      if (collector.intervalId) {
        clearInterval(collector.intervalId);
      }
    });

    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }

    // Close server
    if (this.server) {
      this.server.close();
    }

    console.log('✅ Performance Dashboard stopped');
  }

  // Save metrics to file
  async saveMetrics() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-metrics-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'performance-analysis', 'reports', filename);

    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify({
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      metrics: this.metrics,
      summary: {
        totalDataPoints: Object.values(this.metrics).reduce((sum, arr) => sum + arr.length, 0),
        collectors: this.collectors.length,
        alerts: this.recentAlerts || []
      }
    }, null, 2));

    console.log(`📋 Metrics saved to: ${filepath}`);
  }
}

// Main execution
async function main() {
  const dashboard = new PerformanceDashboard(3030);

  try {
    await dashboard.initialize();
    await dashboard.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down dashboard...');
      await dashboard.saveMetrics();
      await dashboard.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await dashboard.saveMetrics();
      await dashboard.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Dashboard startup failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default PerformanceDashboard;