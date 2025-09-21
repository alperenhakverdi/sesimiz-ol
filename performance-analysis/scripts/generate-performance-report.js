#!/usr/bin/env node

/**
 * Performance Report Generator
 * Aggregates all performance test results and generates comprehensive reports
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '..', 'reports');
    this.outputDir = path.join(__dirname, '..', 'reports', 'consolidated');
  }

  async generateReport() {
    console.log('📊 Generating Comprehensive Performance Report...');

    try {
      await fs.mkdir(this.outputDir, { recursive: true });

      // Gather all report files
      const reports = await this.gatherReports();

      // Generate consolidated report
      const consolidatedReport = await this.consolidateReports(reports);

      // Generate HTML report
      await this.generateHTMLReport(consolidatedReport);

      // Generate markdown summary
      await this.generateMarkdownSummary(consolidatedReport);

      console.log('✅ Performance report generated successfully!');
      console.log(`📋 Reports available in: ${this.outputDir}`);

    } catch (error) {
      console.error('❌ Report generation failed:', error);
      throw error;
    }
  }

  async gatherReports() {
    console.log('📁 Gathering performance reports...');

    const reports = {
      database: [],
      api: [],
      frontend: [],
      loadTests: [],
      monitoring: []
    };

    try {
      const files = await fs.readdir(this.reportsDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.reportsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);

        // Categorize reports
        if (file.includes('db-benchmark')) {
          reports.database.push({ file, data, timestamp: data.timestamp });
        } else if (file.includes('api-load-test')) {
          reports.api.push({ file, data, timestamp: data.timestamp });
        } else if (file.includes('frontend-analysis')) {
          reports.frontend.push({ file, data, timestamp: data.timestamp });
        } else if (file.includes('comprehensive-load-test')) {
          reports.loadTests.push({ file, data, timestamp: data.timestamp });
        } else if (file.includes('performance-metrics')) {
          reports.monitoring.push({ file, data, timestamp: data.timestamp });
        }
      }

      // Sort by timestamp (newest first)
      Object.keys(reports).forEach(key => {
        reports[key].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });

      console.log(`   Found ${Object.values(reports).flat().length} reports`);
      return reports;

    } catch (error) {
      console.error('❌ Error gathering reports:', error);
      return reports;
    }
  }

  async consolidateReports(reports) {
    console.log('🔄 Consolidating performance data...');

    const latestReports = {
      database: reports.database[0]?.data || null,
      api: reports.api[0]?.data || null,
      frontend: reports.frontend[0]?.data || null,
      loadTest: reports.loadTests[0]?.data || null,
      monitoring: reports.monitoring[0]?.data || null
    };

    const consolidated = {
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(latestReports),
      performance: this.analyzePerformance(latestReports),
      recommendations: this.consolidateRecommendations(latestReports),
      trends: this.analyzeTrends(reports),
      details: latestReports,
      historical: {
        database: reports.database.slice(1, 6), // Last 5 reports
        api: reports.api.slice(1, 6),
        frontend: reports.frontend.slice(1, 6),
        loadTests: reports.loadTests.slice(1, 6)
      }
    };

    return consolidated;
  }

  generateSummary(reports) {
    const summary = {
      overallHealth: 'UNKNOWN',
      lastTestDate: null,
      keyMetrics: {
        avgApiResponseTime: null,
        dbQueryPerformance: null,
        frontendBundleSize: null,
        maxConcurrentUsers: null
      },
      issues: [],
      strengths: []
    };

    // Database summary
    if (reports.database) {
      const basicQueries = reports.database.basicQueries || [];
      const avgQueryTime = basicQueries.reduce((sum, q) => sum + (q.avgTime || 0), 0) / basicQueries.length;
      summary.keyMetrics.dbQueryPerformance = Math.round(avgQueryTime * 100) / 100;

      if (avgQueryTime > 200) {
        summary.issues.push('Database queries are slow (>200ms average)');
      } else if (avgQueryTime < 100) {
        summary.strengths.push('Database queries are fast (<100ms average)');
      }
    }

    // API summary
    if (reports.api && reports.api.singleUserBaseline) {
      const endpoints = reports.api.singleUserBaseline;
      const avgTime = endpoints.reduce((sum, e) => sum + (e.avgTime || 0), 0) / endpoints.length;
      summary.keyMetrics.avgApiResponseTime = Math.round(avgTime * 100) / 100;

      if (avgTime > 300) {
        summary.issues.push('API response times are slow (>300ms average)');
      } else if (avgTime < 150) {
        summary.strengths.push('API response times are fast (<150ms average)');
      }
    }

    // Frontend summary
    if (reports.frontend && reports.frontend.bundleSize) {
      summary.keyMetrics.frontendBundleSize = reports.frontend.bundleSize.totalSize;

      if (reports.frontend.bundleSize.totalSize > 2 * 1024 * 1024) { // 2MB
        summary.issues.push('Frontend bundle size is large (>2MB)');
      } else if (reports.frontend.bundleSize.totalSize < 1 * 1024 * 1024) { // 1MB
        summary.strengths.push('Frontend bundle size is optimized (<1MB)');
      }
    }

    // Load test summary
    if (reports.loadTest && reports.loadTest.scenarios) {
      const maxUsers = Object.keys(reports.loadTest.scenarios.concurrentUserTests || {})
        .map(Number)
        .filter(n => !isNaN(n))
        .reduce((max, n) => Math.max(max, n), 0);

      summary.keyMetrics.maxConcurrentUsers = maxUsers;

      if (maxUsers < 50) {
        summary.issues.push('Low concurrent user capacity (<50 users)');
      } else if (maxUsers > 100) {
        summary.strengths.push('Good concurrent user capacity (>100 users)');
      }
    }

    // Determine overall health
    const issueCount = summary.issues.length;
    const strengthCount = summary.strengths.length;

    if (issueCount === 0 && strengthCount > 2) {
      summary.overallHealth = 'EXCELLENT';
    } else if (issueCount <= 1 && strengthCount >= 1) {
      summary.overallHealth = 'GOOD';
    } else if (issueCount <= 2) {
      summary.overallHealth = 'FAIR';
    } else {
      summary.overallHealth = 'NEEDS_IMPROVEMENT';
    }

    // Find most recent test
    const timestamps = Object.values(reports)
      .filter(r => r && r.timestamp)
      .map(r => new Date(r.timestamp));

    if (timestamps.length > 0) {
      summary.lastTestDate = new Date(Math.max(...timestamps)).toISOString();
    }

    return summary;
  }

  analyzePerformance(reports) {
    const performance = {
      database: null,
      api: null,
      frontend: null,
      scalability: null
    };

    // Database performance
    if (reports.database) {
      performance.database = {
        avgQueryTime: reports.database.basicQueries?.reduce((sum, q) => sum + (q.avgTime || 0), 0) / reports.database.basicQueries?.length || 0,
        slowQueries: reports.database.slowQueryAnalysis?.slowQueries || 0,
        indexEfficiency: reports.database.indexEfficiency?.reduce((sum, i) => sum + (i.avgTime || 0), 0) / reports.database.indexEfficiency?.length || 0,
        rating: this.ratePerformance('database', reports.database)
      };
    }

    // API performance
    if (reports.api) {
      const singleUser = reports.api.singleUserBaseline || [];
      const concurrent = Object.values(reports.api.concurrentUserTests || {});

      performance.api = {
        avgResponseTime: singleUser.reduce((sum, e) => sum + (e.avgTime || 0), 0) / singleUser.length || 0,
        successRate: singleUser.reduce((sum, e) => sum + (e.successRate || 0), 0) / singleUser.length || 0,
        scalabilityDegradation: concurrent.length > 1 ?
          (concurrent[concurrent.length - 1]?.avgResponseTime || 0) / (concurrent[0]?.avgResponseTime || 1) : 1,
        rating: this.ratePerformance('api', reports.api)
      };
    }

    // Frontend performance
    if (reports.frontend) {
      performance.frontend = {
        bundleSize: reports.frontend.bundleSize?.totalSize || 0,
        loadingOptimizations: this.countOptimizations(reports.frontend),
        dependencyCount: reports.frontend.dependencies?.production || 0,
        rating: this.ratePerformance('frontend', reports.frontend)
      };
    }

    // Scalability
    if (reports.loadTest) {
      performance.scalability = {
        maxConcurrentUsers: this.extractMaxUsers(reports.loadTest),
        overallSuccessRate: this.calculateOverallSuccessRate(reports.loadTest),
        memoryStability: this.analyzeMemoryStability(reports.loadTest),
        rating: this.ratePerformance('scalability', reports.loadTest)
      };
    }

    return performance;
  }

  ratePerformance(category, data) {
    if (!data) return 'UNKNOWN';

    switch (category) {
      case 'database':
        const avgQuery = data.basicQueries?.reduce((sum, q) => sum + (q.avgTime || 0), 0) / data.basicQueries?.length || 0;
        if (avgQuery < 50) return 'EXCELLENT';
        if (avgQuery < 100) return 'GOOD';
        if (avgQuery < 200) return 'FAIR';
        return 'POOR';

      case 'api':
        const avgApi = data.singleUserBaseline?.reduce((sum, e) => sum + (e.avgTime || 0), 0) / data.singleUserBaseline?.length || 0;
        if (avgApi < 100) return 'EXCELLENT';
        if (avgApi < 200) return 'GOOD';
        if (avgApi < 400) return 'FAIR';
        return 'POOR';

      case 'frontend':
        const bundleSize = data.bundleSize?.totalSize || 0;
        if (bundleSize < 500 * 1024) return 'EXCELLENT';
        if (bundleSize < 1024 * 1024) return 'GOOD';
        if (bundleSize < 2 * 1024 * 1024) return 'FAIR';
        return 'POOR';

      case 'scalability':
        const maxUsers = this.extractMaxUsers(data);
        if (maxUsers > 100) return 'EXCELLENT';
        if (maxUsers > 50) return 'GOOD';
        if (maxUsers > 25) return 'FAIR';
        return 'POOR';

      default:
        return 'UNKNOWN';
    }
  }

  consolidateRecommendations(reports) {
    const recommendations = [];

    // Collect recommendations from all reports
    Object.values(reports).forEach(report => {
      if (report && report.recommendations) {
        recommendations.push(...report.recommendations);
      }
    });

    // Deduplicate and prioritize
    const deduplicated = recommendations.reduce((acc, rec) => {
      const key = `${rec.category || 'General'}-${rec.issue || rec.solution}`;
      if (!acc[key] || rec.priority === 'HIGH') {
        acc[key] = rec;
      }
      return acc;
    }, {});

    // Sort by priority
    const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    const sorted = Object.values(deduplicated).sort((a, b) => {
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    });

    return sorted.slice(0, 15); // Top 15 recommendations
  }

  analyzeTrends(reports) {
    const trends = {
      database: this.analyzeTrend(reports.database, 'avgQueryTime'),
      api: this.analyzeTrend(reports.api, 'avgResponseTime'),
      frontend: this.analyzeTrend(reports.frontend, 'bundleSize'),
      scalability: this.analyzeTrend(reports.loadTests, 'maxUsers')
    };

    return trends;
  }

  analyzeTrend(reportArray, metric) {
    if (!reportArray || reportArray.length < 2) {
      return { trend: 'INSUFFICIENT_DATA', change: 0 };
    }

    const values = reportArray.slice(0, 5).map(r => this.extractMetricValue(r.data, metric));
    const validValues = values.filter(v => v !== null && !isNaN(v));

    if (validValues.length < 2) {
      return { trend: 'INSUFFICIENT_DATA', change: 0 };
    }

    const latest = validValues[0];
    const previous = validValues[1];
    const change = ((latest - previous) / previous) * 100;

    let trend;
    if (Math.abs(change) < 5) {
      trend = 'STABLE';
    } else if (change > 0) {
      trend = metric === 'bundleSize' ? 'DEGRADING' : 'IMPROVING'; // Inverse for size metrics
    } else {
      trend = metric === 'bundleSize' ? 'IMPROVING' : 'DEGRADING';
    }

    return { trend, change: Math.round(change * 100) / 100, values: validValues };
  }

  extractMetricValue(data, metric) {
    switch (metric) {
      case 'avgQueryTime':
        return data.basicQueries?.reduce((sum, q) => sum + (q.avgTime || 0), 0) / data.basicQueries?.length || null;
      case 'avgResponseTime':
        return data.singleUserBaseline?.reduce((sum, e) => sum + (e.avgTime || 0), 0) / data.singleUserBaseline?.length || null;
      case 'bundleSize':
        return data.bundleSize?.totalSize || null;
      case 'maxUsers':
        return this.extractMaxUsers(data);
      default:
        return null;
    }
  }

  extractMaxUsers(loadTestData) {
    if (!loadTestData || !loadTestData.scenarios) return 0;

    const concurrent = loadTestData.scenarios.concurrentUserTests || {};
    return Object.keys(concurrent)
      .map(Number)
      .filter(n => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
  }

  calculateOverallSuccessRate(loadTestData) {
    if (!loadTestData || !loadTestData.scenarios) return 0;

    const scenarios = Object.values(loadTestData.scenarios);
    const rates = scenarios
      .map(s => s.successRate)
      .filter(r => typeof r === 'number');

    return rates.length > 0 ? rates.reduce((sum, r) => sum + r, 0) / rates.length : 0;
  }

  analyzeMemoryStability(loadTestData) {
    if (!loadTestData || !loadTestData.scenarios || !loadTestData.scenarios.sustainedLoad) {
      return 'UNKNOWN';
    }

    const memoryTrend = loadTestData.scenarios.sustainedLoad.memoryTrend;
    if (!memoryTrend) return 'UNKNOWN';

    const growth = memoryTrend.rssGrowthPercent || 0;
    if (growth < 10) return 'EXCELLENT';
    if (growth < 25) return 'GOOD';
    if (growth < 50) return 'FAIR';
    return 'POOR';
  }

  countOptimizations(frontendData) {
    const optimizations = [];

    if (frontendData.loadingPerformance?.hasPreload) optimizations.push('Resource Preloading');
    if (frontendData.loadingPerformance?.hasAsyncScripts) optimizations.push('Async Scripts');
    if (frontendData.loadingPerformance?.hasDeferScripts) optimizations.push('Deferred Scripts');
    if (frontendData.bundleSize?.assets?.some(a => a.type === 'Image' && a.name.includes('.webp'))) {
      optimizations.push('WebP Images');
    }

    return optimizations;
  }

  async generateHTMLReport(consolidatedReport) {
    console.log('📄 Generating HTML report...');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sesimiz Ol - Performance Analysis Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-left: 4px solid #667eea; }
        .card h3 { color: #2d3748; margin-bottom: 15px; font-size: 1.3em; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        .metric:last-child { border-bottom: none; }
        .metric-value { font-weight: bold; font-size: 1.1em; }
        .status-excellent { color: #48bb78; }
        .status-good { color: #38a169; }
        .status-fair { color: #ed8936; }
        .status-poor { color: #e53e3e; }
        .status-unknown { color: #a0aec0; }
        .recommendations { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-bottom: 30px; }
        .recommendation { padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid; }
        .rec-critical { background: #fed7d7; border-color: #e53e3e; }
        .rec-high { background: #feebc8; border-color: #dd6b20; }
        .rec-medium { background: #fefcbf; border-color: #d69e2e; }
        .rec-low { background: #c6f6d5; border-color: #38a169; }
        .trend { font-size: 0.9em; padding: 4px 8px; border-radius: 4px; margin-left: 10px; }
        .trend-improving { background: #c6f6d5; color: #22543d; }
        .trend-stable { background: #e2e8f0; color: #2d3748; }
        .trend-degrading { background: #fed7d7; color: #742a2a; }
        .summary-health { font-size: 2em; margin: 20px 0; text-align: center; padding: 20px; border-radius: 12px; }
        .footer { text-align: center; padding: 30px; color: #718096; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f7fafc; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Performance Analysis Report</h1>
            <p>Comprehensive performance evaluation for Sesimiz Ol platform</p>
            <p><small>Generated: ${new Date(consolidatedReport.generatedAt).toLocaleString()}</small></p>
        </div>

        <div class="summary-health status-${consolidatedReport.summary.overallHealth.toLowerCase()}">
            Overall System Health: <strong>${consolidatedReport.summary.overallHealth.replace('_', ' ')}</strong>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🗄️ Database Performance</h3>
                ${consolidatedReport.performance.database ? `
                <div class="metric">
                    <span>Average Query Time</span>
                    <span class="metric-value status-${consolidatedReport.performance.database.rating.toLowerCase()}">
                        ${consolidatedReport.performance.database.avgQueryTime.toFixed(2)}ms
                        ${this.getTrendBadge(consolidatedReport.trends.database)}
                    </span>
                </div>
                <div class="metric">
                    <span>Slow Queries</span>
                    <span class="metric-value">${consolidatedReport.performance.database.slowQueries}</span>
                </div>
                <div class="metric">
                    <span>Index Efficiency</span>
                    <span class="metric-value">${consolidatedReport.performance.database.indexEfficiency.toFixed(2)}ms</span>
                </div>
                <div class="metric">
                    <span>Overall Rating</span>
                    <span class="metric-value status-${consolidatedReport.performance.database.rating.toLowerCase()}">${consolidatedReport.performance.database.rating}</span>
                </div>
                ` : '<p>No database performance data available</p>'}
            </div>

            <div class="card">
                <h3>🌐 API Performance</h3>
                ${consolidatedReport.performance.api ? `
                <div class="metric">
                    <span>Average Response Time</span>
                    <span class="metric-value status-${consolidatedReport.performance.api.rating.toLowerCase()}">
                        ${consolidatedReport.performance.api.avgResponseTime.toFixed(2)}ms
                        ${this.getTrendBadge(consolidatedReport.trends.api)}
                    </span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value">${consolidatedReport.performance.api.successRate.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Scalability Factor</span>
                    <span class="metric-value">${consolidatedReport.performance.api.scalabilityDegradation.toFixed(1)}x</span>
                </div>
                <div class="metric">
                    <span>Overall Rating</span>
                    <span class="metric-value status-${consolidatedReport.performance.api.rating.toLowerCase()}">${consolidatedReport.performance.api.rating}</span>
                </div>
                ` : '<p>No API performance data available</p>'}
            </div>

            <div class="card">
                <h3>⚡ Frontend Performance</h3>
                ${consolidatedReport.performance.frontend ? `
                <div class="metric">
                    <span>Bundle Size</span>
                    <span class="metric-value status-${consolidatedReport.performance.frontend.rating.toLowerCase()}">
                        ${this.formatBytes(consolidatedReport.performance.frontend.bundleSize)}
                        ${this.getTrendBadge(consolidatedReport.trends.frontend)}
                    </span>
                </div>
                <div class="metric">
                    <span>Dependencies</span>
                    <span class="metric-value">${consolidatedReport.performance.frontend.dependencyCount}</span>
                </div>
                <div class="metric">
                    <span>Optimizations</span>
                    <span class="metric-value">${consolidatedReport.performance.frontend.loadingOptimizations.length}</span>
                </div>
                <div class="metric">
                    <span>Overall Rating</span>
                    <span class="metric-value status-${consolidatedReport.performance.frontend.rating.toLowerCase()}">${consolidatedReport.performance.frontend.rating}</span>
                </div>
                ` : '<p>No frontend performance data available</p>'}
            </div>

            <div class="card">
                <h3>📈 Scalability</h3>
                ${consolidatedReport.performance.scalability ? `
                <div class="metric">
                    <span>Max Concurrent Users</span>
                    <span class="metric-value status-${consolidatedReport.performance.scalability.rating.toLowerCase()}">
                        ${consolidatedReport.performance.scalability.maxConcurrentUsers}
                        ${this.getTrendBadge(consolidatedReport.trends.scalability)}
                    </span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value">${consolidatedReport.performance.scalability.overallSuccessRate.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span>Memory Stability</span>
                    <span class="metric-value">${consolidatedReport.performance.scalability.memoryStability}</span>
                </div>
                <div class="metric">
                    <span>Overall Rating</span>
                    <span class="metric-value status-${consolidatedReport.performance.scalability.rating.toLowerCase()}">${consolidatedReport.performance.scalability.rating}</span>
                </div>
                ` : '<p>No scalability data available</p>'}
            </div>
        </div>

        <div class="recommendations">
            <h3>💡 Performance Recommendations</h3>
            ${consolidatedReport.recommendations.slice(0, 10).map(rec => `
                <div class="recommendation rec-${(rec.priority || 'medium').toLowerCase()}">
                    <strong>[${rec.priority || 'MEDIUM'}] ${rec.category || 'General'}</strong><br>
                    ${rec.issue || rec.solution}<br>
                    ${rec.solution && rec.issue ? `<small><strong>Solution:</strong> ${rec.solution}</small>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="card">
            <h3>🔍 Summary Insights</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h4 style="color: #48bb78; margin-bottom: 10px;">✅ Strengths</h4>
                    <ul>
                        ${consolidatedReport.summary.strengths.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h4 style="color: #e53e3e; margin-bottom: 10px;">⚠️ Issues</h4>
                    <ul>
                        ${consolidatedReport.summary.issues.map(i => `<li>${i}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Performance analysis completed by Sesimiz Ol Performance Engineering Team</p>
            <p><small>For detailed technical information, refer to individual test reports</small></p>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.outputDir, 'performance-report.html');
    await fs.writeFile(htmlPath, html);
    console.log(`   📄 HTML report: ${htmlPath}`);
  }

  getTrendBadge(trend) {
    if (!trend || trend.trend === 'INSUFFICIENT_DATA') return '';

    const trendClass = `trend-${trend.trend.toLowerCase()}`;
    const arrow = trend.trend === 'IMPROVING' ? '↗️' : trend.trend === 'DEGRADING' ? '↘️' : '→';
    const change = Math.abs(trend.change || 0);

    return `<span class="trend ${trendClass}">${arrow} ${change.toFixed(1)}%</span>`;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async generateMarkdownSummary(consolidatedReport) {
    console.log('📝 Generating Markdown summary...');

    const markdown = `# Performance Analysis Summary

Generated: ${new Date(consolidatedReport.generatedAt).toLocaleString()}

## Overall Health: ${consolidatedReport.summary.overallHealth.replace('_', ' ')}

### Key Metrics

| Category | Metric | Value | Rating | Trend |
|----------|---------|-------|--------|-------|
| Database | Avg Query Time | ${consolidatedReport.performance.database?.avgQueryTime?.toFixed(2) || 'N/A'}ms | ${consolidatedReport.performance.database?.rating || 'N/A'} | ${consolidatedReport.trends.database?.trend || 'N/A'} |
| API | Avg Response Time | ${consolidatedReport.performance.api?.avgResponseTime?.toFixed(2) || 'N/A'}ms | ${consolidatedReport.performance.api?.rating || 'N/A'} | ${consolidatedReport.trends.api?.trend || 'N/A'} |
| Frontend | Bundle Size | ${this.formatBytes(consolidatedReport.performance.frontend?.bundleSize || 0)} | ${consolidatedReport.performance.frontend?.rating || 'N/A'} | ${consolidatedReport.trends.frontend?.trend || 'N/A'} |
| Scalability | Max Users | ${consolidatedReport.performance.scalability?.maxConcurrentUsers || 'N/A'} | ${consolidatedReport.performance.scalability?.rating || 'N/A'} | ${consolidatedReport.trends.scalability?.trend || 'N/A'} |

### Top Priority Recommendations

${consolidatedReport.recommendations.slice(0, 5).map((rec, i) =>
  `${i + 1}. **[${rec.priority}] ${rec.category}**: ${rec.issue || rec.solution}`
).join('\n')}

### System Strengths

${consolidatedReport.summary.strengths.map(s => `- ✅ ${s}`).join('\n')}

### Areas for Improvement

${consolidatedReport.summary.issues.map(i => `- ⚠️ ${i}`).join('\n')}

---

*For detailed analysis, see the full HTML report: performance-report.html*
`;

    const markdownPath = path.join(this.outputDir, 'performance-summary.md');
    await fs.writeFile(markdownPath, markdown);
    console.log(`   📝 Markdown summary: ${markdownPath}`);
  }
}

// Main execution
async function main() {
  const generator = new PerformanceReportGenerator();

  try {
    await generator.generateReport();
    console.log('\n🎉 Performance report generation completed!');
    console.log('📊 View your reports:');
    console.log(`   HTML: ${generator.outputDir}/performance-report.html`);
    console.log(`   Summary: ${generator.outputDir}/performance-summary.md`);
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default PerformanceReportGenerator;