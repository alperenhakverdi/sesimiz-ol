#!/usr/bin/env node

/**
 * API Load Testing Tool
 * Simulates concurrent users and measures API performance under load
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class APILoadTester {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.results = [];
    this.errors = [];
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.completedRequests = 0;
    this.failedRequests = 0;

    // Request statistics
    this.responseTimes = [];
    this.requestsPerSecond = [];
    this.memoryUsage = [];
  }

  async makeRequest(endpoint, options = {}) {
    const url = new URL(endpoint, this.baseURL);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'PerformanceTest/1.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.body));
    }

    return new Promise((resolve, reject) => {
      const startTime = performance.now();

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const endTime = performance.now();
          const duration = endTime - startTime;

          const result = {
            endpoint: endpoint,
            method: requestOptions.method,
            statusCode: res.statusCode,
            duration: Math.round(duration * 100) / 100,
            responseSize: data.length,
            timestamp: Date.now(),
            success: res.statusCode >= 200 && res.statusCode < 400
          };

          this.responseTimes.push(duration);

          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
          }
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        reject({
          endpoint: endpoint,
          method: requestOptions.method,
          error: error.message,
          duration: Math.round(duration * 100) / 100,
          timestamp: Date.now(),
          success: false
        });
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testSingleUser() {
    console.log('👤 Testing single user performance...');

    const endpoints = [
      { path: '/health', name: 'Health Check' },
      { path: '/api/stories', name: 'Get Stories' },
      { path: '/api/stories/categories', name: 'Get Categories' },
      { path: '/api/stories/popular', name: 'Get Popular Stories' },
      { path: '/api/stories/trending', name: 'Get Trending Stories' },
      { path: '/api/stories/stats', name: 'Get Platform Stats' },
      { path: '/api/stories/search?q=test', name: 'Search Stories' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`   Testing: ${endpoint.name}`);

      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const result = await this.makeRequest(endpoint.path);
          times.push(result.duration);
        } catch (error) {
          console.error(`     ❌ Request failed:`, error.message || error);
          times.push(null);
        }
      }

      const validTimes = times.filter(t => t !== null);
      if (validTimes.length > 0) {
        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const min = Math.min(...validTimes);
        const max = Math.max(...validTimes);

        results.push({
          endpoint: endpoint.name,
          avgTime: Math.round(avg * 100) / 100,
          minTime: Math.round(min * 100) / 100,
          maxTime: Math.round(max * 100) / 100,
          successRate: (validTimes.length / iterations) * 100
        });

        console.log(`     ✅ Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      } else {
        results.push({
          endpoint: endpoint.name,
          avgTime: null,
          successRate: 0,
          error: 'All requests failed'
        });
        console.log(`     ❌ All requests failed`);
      }
    }

    return results;
  }

  async testConcurrentUsers(userCount, duration = 30000) {
    console.log(`\n👥 Testing ${userCount} concurrent users for ${duration/1000}s...`);

    const startTime = Date.now();
    const endTime = startTime + duration;
    const workers = [];
    const results = [];

    // Create worker promises
    for (let i = 0; i < userCount; i++) {
      workers.push(this.simulateUser(i, endTime, results));
    }

    // Start monitoring
    const monitoringInterval = setInterval(() => {
      this.recordMetrics();
    }, 1000);

    try {
      await Promise.all(workers);
    } finally {
      clearInterval(monitoringInterval);
    }

    return this.analyzeResults(results, duration);
  }

  async simulateUser(userId, endTime, results) {
    const endpoints = [
      '/api/stories',
      '/api/stories/popular',
      '/api/stories/trending',
      '/api/stories/categories'
    ];

    while (Date.now() < endTime) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

      try {
        const result = await this.makeRequest(endpoint);
        results.push({
          userId,
          ...result
        });
        this.completedRequests++;
      } catch (error) {
        results.push({
          userId,
          endpoint,
          success: false,
          error: error.message || error,
          timestamp: Date.now()
        });
        this.failedRequests++;
      }

      this.totalRequests++;

      // Random delay between requests (0.5-2 seconds)
      const delay = Math.random() * 1500 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  recordMetrics() {
    const memUsage = process.memoryUsage();
    this.memoryUsage.push({
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    });

    // Calculate requests per second for the last interval
    const now = Date.now();
    const recentRequests = this.responseTimes.filter(
      () => now - 1000 <= now // Last second (simplified)
    );

    this.requestsPerSecond.push({
      timestamp: now,
      rps: recentRequests.length
    });
  }

  analyzeResults(results, duration) {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    if (successfulResults.length === 0) {
      return {
        totalRequests: results.length,
        successfulRequests: 0,
        failedRequests: failedResults.length,
        successRate: 0,
        avgResponseTime: null,
        error: 'No successful requests'
      };
    }

    const responseTimes = successfulResults.map(r => r.duration);
    responseTimes.sort((a, b) => a - b);

    return {
      duration: duration,
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      successRate: (successfulResults.length / results.length) * 100,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: (results.length / duration) * 1000,
      throughput: (successfulResults.length / duration) * 1000,
      errorsByType: this.groupErrorsByType(failedResults),
      memoryStats: this.analyzeMemoryUsage()
    };
  }

  groupErrorsByType(failedResults) {
    const errorGroups = {};

    failedResults.forEach(result => {
      const errorType = result.error || 'Unknown Error';
      if (!errorGroups[errorType]) {
        errorGroups[errorType] = 0;
      }
      errorGroups[errorType]++;
    });

    return errorGroups;
  }

  analyzeMemoryUsage() {
    if (this.memoryUsage.length === 0) return null;

    const rssValues = this.memoryUsage.map(m => m.rss);
    const heapValues = this.memoryUsage.map(m => m.heapUsed);

    return {
      maxRSS: Math.max(...rssValues),
      avgRSS: rssValues.reduce((a, b) => a + b, 0) / rssValues.length,
      maxHeap: Math.max(...heapValues),
      avgHeap: heapValues.reduce((a, b) => a + b, 0) / heapValues.length,
      samples: this.memoryUsage.length
    };
  }

  async runLoadTestSuite() {
    console.log('🚀 Starting API Load Testing Suite\n');

    const testSuite = {
      singleUser: null,
      concurrentTests: {}
    };

    try {
      // Single user baseline
      testSuite.singleUser = await this.testSingleUser();

      // Concurrent user tests
      const concurrentLevels = [1, 5, 10, 25, 50, 100];

      for (const userCount of concurrentLevels) {
        console.log(`\n🔄 Testing ${userCount} concurrent users...`);

        // Reset metrics for each test
        this.responseTimes = [];
        this.memoryUsage = [];
        this.requestsPerSecond = [];
        this.totalRequests = 0;
        this.completedRequests = 0;
        this.failedRequests = 0;

        try {
          const result = await this.testConcurrentUsers(userCount, 30000); // 30 second test
          testSuite.concurrentTests[userCount] = result;

          console.log(`   ✅ Success rate: ${result.successRate.toFixed(1)}%`);
          console.log(`   ✅ Avg response time: ${result.avgResponseTime.toFixed(2)}ms`);
          console.log(`   ✅ Throughput: ${result.throughput.toFixed(2)} req/s`);

          // Cool down between tests
          console.log('   😴 Cooling down for 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, 5000));

        } catch (error) {
          console.error(`   ❌ Test failed for ${userCount} users:`, error.message);
          testSuite.concurrentTests[userCount] = { error: error.message };
        }
      }

      return testSuite;

    } catch (error) {
      console.error('❌ Load testing suite failed:', error);
      throw error;
    }
  }

  async generateLoadTestReport(testSuite) {
    const report = {
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL,
      testDuration: Date.now() - this.startTime,
      singleUserBaseline: testSuite.singleUser,
      concurrentUserTests: testSuite.concurrentTests,
      recommendations: this.generateLoadTestRecommendations(testSuite)
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'performance-analysis', 'reports', `api-load-test-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📋 Load test report saved to: ${reportPath}`);
    return report;
  }

  generateLoadTestRecommendations(testSuite) {
    const recommendations = [];

    // Analyze single user performance
    if (testSuite.singleUser) {
      const slowEndpoints = testSuite.singleUser.filter(result => result.avgTime > 200);
      if (slowEndpoints.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Response Time',
          issue: `${slowEndpoints.length} endpoints have slow response times (>200ms)`,
          details: slowEndpoints.map(e => `${e.endpoint}: ${e.avgTime}ms`),
          solution: 'Optimize database queries, add caching, or implement pagination'
        });
      }
    }

    // Analyze concurrent performance degradation
    const concurrentResults = Object.values(testSuite.concurrentTests).filter(r => !r.error);
    if (concurrentResults.length >= 2) {
      const baseline = concurrentResults[0];
      const highLoad = concurrentResults[concurrentResults.length - 1];

      if (highLoad.avgResponseTime > baseline.avgResponseTime * 2) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Scalability',
          issue: 'Response time degrades significantly under load',
          details: `${baseline.avgResponseTime.toFixed(2)}ms → ${highLoad.avgResponseTime.toFixed(2)}ms`,
          solution: 'Implement horizontal scaling, optimize database connections, or add load balancing'
        });
      }

      if (highLoad.successRate < 95) {
        recommendations.push({
          priority: 'CRITICAL',
          category: 'Reliability',
          issue: `High error rate under load (${(100 - highLoad.successRate).toFixed(1)}% failures)`,
          solution: 'Implement circuit breakers, improve error handling, or add rate limiting'
        });
      }
    }

    // Memory usage analysis
    concurrentResults.forEach((result, index) => {
      if (result.memoryStats && result.memoryStats.maxRSS > 1024 * 1024 * 1024) { // 1GB
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Memory Usage',
          issue: `High memory usage detected (${(result.memoryStats.maxRSS / 1024 / 1024).toFixed(0)}MB)`,
          solution: 'Investigate memory leaks, optimize data structures, or implement garbage collection tuning'
        });
      }
    });

    return recommendations;
  }
}

// Main execution
async function main() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
  const tester = new APILoadTester(baseURL);

  try {
    const testSuite = await tester.runLoadTestSuite();
    const report = await tester.generateLoadTestReport(testSuite);

    console.log('\n📊 Load Testing Summary:');
    console.log(`   Base URL: ${baseURL}`);
    console.log(`   Test Duration: ${Math.round(report.testDuration / 1000)}s`);

    if (report.singleUserBaseline) {
      const avgSingleUser = report.singleUserBaseline
        .filter(r => r.avgTime !== null)
        .reduce((sum, r) => sum + r.avgTime, 0) / report.singleUserBaseline.length || 0;
      console.log(`   Single User Avg: ${avgSingleUser.toFixed(2)}ms`);
    }

    const concurrentKeys = Object.keys(report.concurrentUserTests);
    if (concurrentKeys.length > 0) {
      const maxUsers = Math.max(...concurrentKeys.map(Number));
      const maxUserResult = report.concurrentUserTests[maxUsers];
      if (!maxUserResult.error) {
        console.log(`   Max Concurrent Users: ${maxUsers}`);
        console.log(`   Max Load Success Rate: ${maxUserResult.successRate.toFixed(1)}%`);
        console.log(`   Max Load Avg Response: ${maxUserResult.avgResponseTime.toFixed(2)}ms`);
        console.log(`   Max Load Throughput: ${maxUserResult.throughput.toFixed(2)} req/s`);
      }
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   [${rec.priority}] ${rec.category}: ${rec.issue}`);
      console.log(`        Solution: ${rec.solution}`);
      if (rec.details) {
        console.log(`        Details: ${Array.isArray(rec.details) ? rec.details.join(', ') : rec.details}`);
      }
    });

  } catch (error) {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default APILoadTester;