#!/usr/bin/env node

/**
 * Comprehensive Load Testing Suite
 * Tests various scenarios with different user loads and usage patterns
 */

import APILoadTester from '../benchmarks/api-load-tester.js';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class ComprehensiveLoadTest {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.loadTester = new APILoadTester(baseURL);
    this.scenarios = [];
    this.results = {};
  }

  // Scenario 1: Single User Journey
  async singleUserScenario() {
    console.log('👤 Scenario 1: Single User Journey');

    const userJourney = [
      { endpoint: '/health', name: 'Health Check' },
      { endpoint: '/api/stories', name: 'Browse Stories' },
      { endpoint: '/api/stories/popular', name: 'View Popular' },
      { endpoint: '/api/stories/categories', name: 'Browse Categories' },
      { endpoint: '/api/stories/search?q=test', name: 'Search Stories' },
      { endpoint: '/api/stories/trending', name: 'View Trending' },
      { endpoint: '/api/stories/stats', name: 'Platform Stats' }
    ];

    const results = [];
    const startTime = performance.now();

    for (const step of userJourney) {
      console.log(`   ${step.name}...`);

      const iterations = 3;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const result = await this.loadTester.makeRequest(step.endpoint);
          times.push(result.duration);

          // Simulate user reading time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

        } catch (error) {
          times.push(null);
        }
      }

      const validTimes = times.filter(t => t !== null);
      if (validTimes.length > 0) {
        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        results.push({
          step: step.name,
          endpoint: step.endpoint,
          avgTime: avg,
          successRate: (validTimes.length / iterations) * 100
        });
      }
    }

    const totalTime = performance.now() - startTime;

    return {
      scenario: 'Single User Journey',
      totalTime: totalTime,
      steps: results,
      avgStepTime: results.reduce((sum, r) => sum + r.avgTime, 0) / results.length,
      overallSuccessRate: results.reduce((sum, r) => sum + r.successRate, 0) / results.length
    };
  }

  // Scenario 2: Read-Heavy Workload (90% reads, 10% writes)
  async readHeavyScenario(userCount = 25, duration = 60000) {
    console.log(`📖 Scenario 2: Read-Heavy Workload (${userCount} users, ${duration/1000}s)`);

    const readEndpoints = [
      '/api/stories',
      '/api/stories/popular',
      '/api/stories/trending',
      '/api/stories/categories',
      '/api/stories/search?q=hayat',
      '/api/stories/stats'
    ];

    const writeEndpoints = [
      // Simulated write operations (would require auth in real scenario)
      '/api/stories/1/view'
    ];

    return await this.loadTester.testConcurrentUsers(userCount, duration, {
      readWeight: 0.9,
      writeWeight: 0.1,
      readEndpoints,
      writeEndpoints
    });
  }

  // Scenario 3: Search-Heavy Workload
  async searchHeavyScenario(userCount = 15, duration = 45000) {
    console.log(`🔍 Scenario 3: Search-Heavy Workload (${userCount} users, ${duration/1000}s)`);

    const searchQueries = [
      'hayat',
      'kadın',
      'güçlü',
      'başarı',
      'umut',
      'cesaret',
      'aşk',
      'mücadele',
      'özgürlük',
      'gelecek'
    ];

    const endTime = Date.now() + duration;
    const workers = [];
    const results = [];

    for (let i = 0; i < userCount; i++) {
      workers.push(this.simulateSearchUser(i, endTime, searchQueries, results));
    }

    await Promise.all(workers);

    return this.analyzeSearchResults(results, duration);
  }

  async simulateSearchUser(userId, endTime, searchQueries, results) {
    while (Date.now() < endTime) {
      const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
      const endpoint = `/api/stories/search?q=${encodeURIComponent(query)}`;

      try {
        const result = await this.loadTester.makeRequest(endpoint);
        results.push({
          userId,
          query,
          ...result
        });
      } catch (error) {
        results.push({
          userId,
          query,
          endpoint,
          success: false,
          error: error.message || error,
          timestamp: Date.now()
        });
      }

      // Simulate user typing and thinking
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
    }
  }

  analyzeSearchResults(results, duration) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length === 0) {
      return {
        scenario: 'Search-Heavy Workload',
        error: 'No successful requests',
        totalRequests: results.length,
        failedRequests: failed.length
      };
    }

    const responseTimes = successful.map(r => r.duration);
    responseTimes.sort((a, b) => a - b);

    // Analyze by query
    const queryStats = {};
    successful.forEach(result => {
      if (!queryStats[result.query]) {
        queryStats[result.query] = [];
      }
      queryStats[result.query].push(result.duration);
    });

    const queryAnalysis = Object.entries(queryStats).map(([query, times]) => ({
      query,
      count: times.length,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    }));

    return {
      scenario: 'Search-Heavy Workload',
      duration,
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / results.length) * 100,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      medianResponseTime: responseTimes[Math.floor(responseTimes.length / 2)],
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      queryAnalysis: queryAnalysis.sort((a, b) => b.avgTime - a.avgTime)
    };
  }

  // Scenario 4: Burst Load Test
  async burstLoadScenario() {
    console.log('💥 Scenario 4: Burst Load Test');

    const burstPattern = [
      { users: 5, duration: 10000, description: 'Warm-up' },
      { users: 50, duration: 30000, description: 'Sudden burst' },
      { users: 10, duration: 15000, description: 'Cool-down' },
      { users: 100, duration: 20000, description: 'Peak burst' },
      { users: 5, duration: 10000, description: 'Recovery' }
    ];

    const results = [];

    for (const burst of burstPattern) {
      console.log(`   ${burst.description}: ${burst.users} users for ${burst.duration/1000}s`);

      try {
        const result = await this.loadTester.testConcurrentUsers(burst.users, burst.duration);
        results.push({
          ...burst,
          ...result
        });

        // Brief pause between bursts
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        results.push({
          ...burst,
          error: error.message
        });
      }
    }

    return {
      scenario: 'Burst Load Test',
      pattern: burstPattern,
      results: results
    };
  }

  // Scenario 5: Sustained Load Test
  async sustainedLoadScenario(userCount = 50, duration = 300000) { // 5 minutes
    console.log(`🔄 Scenario 5: Sustained Load Test (${userCount} users, ${duration/1000/60}min)`);

    const checkpoints = [];
    const checkpointInterval = 30000; // Every 30 seconds
    const startTime = Date.now();

    // Start the load test
    const loadTestPromise = this.loadTester.testConcurrentUsers(userCount, duration);

    // Monitor performance at intervals
    const monitoringInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const memUsage = process.memoryUsage();

      checkpoints.push({
        elapsed,
        memoryUsage: memUsage,
        timestamp: new Date().toISOString()
      });

      console.log(`   Checkpoint ${Math.floor(elapsed / 1000)}s: RSS ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    }, checkpointInterval);

    try {
      const result = await loadTestPromise;
      clearInterval(monitoringInterval);

      return {
        scenario: 'Sustained Load Test',
        duration,
        userCount,
        ...result,
        performanceCheckpoints: checkpoints,
        memoryTrend: this.analyzeMemoryTrend(checkpoints)
      };

    } catch (error) {
      clearInterval(monitoringInterval);
      throw error;
    }
  }

  analyzeMemoryTrend(checkpoints) {
    if (checkpoints.length < 2) return null;

    const rssValues = checkpoints.map(c => c.memoryUsage.rss);
    const heapValues = checkpoints.map(c => c.memoryUsage.heapUsed);

    const rssGrowth = ((rssValues[rssValues.length - 1] - rssValues[0]) / rssValues[0]) * 100;
    const heapGrowth = ((heapValues[heapValues.length - 1] - heapValues[0]) / heapValues[0]) * 100;

    return {
      rssGrowthPercent: rssGrowth,
      heapGrowthPercent: heapGrowth,
      maxRSS: Math.max(...rssValues),
      maxHeap: Math.max(...heapValues),
      avgRSS: rssValues.reduce((a, b) => a + b, 0) / rssValues.length,
      avgHeap: heapValues.reduce((a, b) => a + b, 0) / heapValues.length
    };
  }

  // Run all scenarios
  async runAllScenarios() {
    console.log('🚀 Starting Comprehensive Load Testing Suite\n');

    const startTime = Date.now();
    const results = {};

    try {
      // Scenario 1: Single User Journey
      results.singleUser = await this.singleUserScenario();
      await this.coolDown();

      // Scenario 2: Read-Heavy Workload
      results.readHeavy = await this.readHeavyScenario(25, 60000);
      await this.coolDown();

      // Scenario 3: Search-Heavy Workload
      results.searchHeavy = await this.searchHeavyScenario(15, 45000);
      await this.coolDown();

      // Scenario 4: Burst Load Test
      results.burstLoad = await this.burstLoadScenario();
      await this.coolDown();

      // Scenario 5: Sustained Load Test (shorter for CI)
      results.sustainedLoad = await this.sustainedLoadScenario(30, 120000); // 2 minutes

      const totalTime = Date.now() - startTime;

      const report = {
        timestamp: new Date().toISOString(),
        baseURL: this.baseURL,
        totalTestTime: totalTime,
        scenarios: results,
        summary: this.generateTestSummary(results),
        recommendations: this.generateComprehensiveRecommendations(results)
      };

      await this.saveReport(report);
      return report;

    } catch (error) {
      console.error('❌ Comprehensive load testing failed:', error);
      throw error;
    }
  }

  async coolDown() {
    console.log('   😴 Cooling down...\n');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second cool down
  }

  generateTestSummary(results) {
    const summary = {
      scenariosCompleted: Object.keys(results).length,
      overallHealth: 'GOOD'
    };

    // Analyze overall performance
    if (results.singleUser && results.singleUser.avgStepTime > 500) {
      summary.overallHealth = 'POOR';
    } else if (results.readHeavy && results.readHeavy.successRate < 95) {
      summary.overallHealth = 'CONCERNING';
    } else if (results.sustainedLoad && results.sustainedLoad.memoryTrend?.rssGrowthPercent > 50) {
      summary.overallHealth = 'CONCERNING';
    }

    return summary;
  }

  generateComprehensiveRecommendations(results) {
    const recommendations = [];

    // Single user performance
    if (results.singleUser && results.singleUser.avgStepTime > 300) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Response Time',
        issue: `Slow single user performance (${results.singleUser.avgStepTime.toFixed(2)}ms avg)`,
        solution: 'Optimize database queries, implement caching, or add CDN'
      });
    }

    // Read-heavy performance
    if (results.readHeavy && results.readHeavy.successRate < 98) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Reliability',
        issue: `Read-heavy workload has poor success rate (${results.readHeavy.successRate.toFixed(1)}%)`,
        solution: 'Implement connection pooling, add read replicas, or implement circuit breakers'
      });
    }

    // Search performance
    if (results.searchHeavy && results.searchHeavy.avgResponseTime > 400) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Search Performance',
        issue: `Search queries are slow (${results.searchHeavy.avgResponseTime.toFixed(2)}ms avg)`,
        solution: 'Implement search indexing, add search caching, or use full-text search engine'
      });
    }

    // Burst handling
    if (results.burstLoad) {
      const burstResults = results.burstLoad.results || [];
      const poorBursts = burstResults.filter(r => r.successRate && r.successRate < 90);
      if (poorBursts.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Scalability',
          issue: 'Poor handling of traffic bursts',
          solution: 'Implement auto-scaling, add load balancing, or increase resource limits'
        });
      }
    }

    // Memory leaks
    if (results.sustainedLoad && results.sustainedLoad.memoryTrend) {
      const growth = results.sustainedLoad.memoryTrend.rssGrowthPercent;
      if (growth > 25) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Memory Management',
          issue: `Significant memory growth during sustained load (${growth.toFixed(1)}%)`,
          solution: 'Investigate memory leaks, optimize garbage collection, or implement memory limits'
        });
      }
    }

    return recommendations;
  }

  async saveReport(report) {
    const reportPath = path.join(process.cwd(), 'performance-analysis', 'reports', `comprehensive-load-test-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📋 Comprehensive test report saved to: ${reportPath}`);

    // Print summary
    console.log('\n📊 Test Suite Summary:');
    console.log(`   Total Test Time: ${Math.round(report.totalTestTime / 1000 / 60)}m ${Math.round((report.totalTestTime / 1000) % 60)}s`);
    console.log(`   Scenarios Completed: ${report.summary.scenariosCompleted}`);
    console.log(`   Overall Health: ${report.summary.overallHealth}`);

    if (report.scenarios.singleUser) {
      console.log(`   Single User Avg: ${report.scenarios.singleUser.avgStepTime.toFixed(2)}ms`);
    }

    if (report.scenarios.readHeavy) {
      console.log(`   Read-Heavy Success: ${report.scenarios.readHeavy.successRate.toFixed(1)}%`);
    }

    console.log('\n💡 Top Recommendations:');
    report.recommendations.slice(0, 3).forEach(rec => {
      console.log(`   [${rec.priority}] ${rec.category}: ${rec.issue}`);
    });
  }
}

// Main execution
async function main() {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
  const tester = new ComprehensiveLoadTest(baseURL);

  try {
    await tester.runAllScenarios();
  } catch (error) {
    console.error('❌ Comprehensive load testing failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default ComprehensiveLoadTest;