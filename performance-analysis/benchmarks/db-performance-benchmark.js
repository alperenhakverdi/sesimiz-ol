#!/usr/bin/env node

/**
 * Database Performance Benchmark
 * Analyzes database query performance, connection pool usage, and identifies bottlenecks
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

class DatabaseBenchmark {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
    this.queryMetrics = [];
    this.connectionMetrics = [];
    this.startTime = Date.now();
  }

  async setupMetricsCollection() {
    console.log('🔧 Setting up database metrics collection...');

    // Monitor query performance
    this.prisma.$on('query', (e) => {
      this.queryMetrics.push({
        timestamp: Date.now(),
        query: e.query,
        params: e.params,
        duration: e.duration,
        target: e.target
      });
    });

    console.log('✅ Metrics collection setup complete');
  }

  async benchmarkBasicQueries() {
    console.log('\n📊 Running basic query benchmarks...');

    const queries = [
      {
        name: 'Get All Stories (Paginated)',
        operation: () => this.prisma.story.findMany({
          take: 10,
          skip: 0,
          include: {
            author: { select: { id: true, nickname: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true, color: true } },
            _count: { select: { comments: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
      },
      {
        name: 'Get Story by ID with Relations',
        operation: async () => {
          const stories = await this.prisma.story.findMany({ take: 1 });
          if (stories.length === 0) return null;

          return this.prisma.story.findUnique({
            where: { id: stories[0].id },
            include: {
              author: { select: { id: true, nickname: true, avatar: true } },
              category: { select: { id: true, name: true, slug: true, color: true } },
              tags: { include: { tag: true } },
              comments: {
                include: {
                  author: { select: { id: true, nickname: true, avatar: true } },
                  replies: { include: { author: { select: { id: true, nickname: true } } } }
                }
              },
              _count: { select: { comments: true, supports: true, views: true } }
            }
          });
        }
      },
      {
        name: 'Search Stories with Text',
        operation: () => this.prisma.story.findMany({
          where: {
            OR: [
              { title: { contains: 'hayat', mode: 'insensitive' } },
              { content: { contains: 'hayat', mode: 'insensitive' } }
            ]
          },
          take: 10,
          include: {
            author: { select: { id: true, nickname: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true, color: true } }
          }
        })
      },
      {
        name: 'Get Popular Stories (Complex Query)',
        operation: () => this.prisma.story.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          include: {
            author: { select: { id: true, nickname: true, avatar: true } },
            category: { select: { id: true, name: true, slug: true, color: true } },
            _count: { select: { comments: true, supports: true, views: true } }
          },
          orderBy: [
            { viewCount: 'desc' },
            { supportCount: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 10
        })
      },
      {
        name: 'Get User with All Relations',
        operation: async () => {
          const users = await this.prisma.user.findMany({ take: 1 });
          if (users.length === 0) return null;

          return this.prisma.user.findUnique({
            where: { id: users[0].id },
            include: {
              stories: {
                include: {
                  category: true,
                  _count: { select: { comments: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              _count: {
                select: {
                  stories: true,
                  comments: true,
                  followers: true,
                  following: true
                }
              }
            }
          });
        }
      },
      {
        name: 'Category with Story Count',
        operation: () => this.prisma.category.findMany({
          include: {
            _count: { select: { stories: true } }
          },
          orderBy: { sortOrder: 'asc' }
        })
      }
    ];

    const results = [];

    for (const query of queries) {
      console.log(`   Testing: ${query.name}`);

      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        try {
          await query.operation();
          const duration = performance.now() - start;
          times.push(duration);
        } catch (error) {
          console.error(`     ❌ Error in ${query.name}:`, error.message);
          times.push(null);
        }
      }

      const validTimes = times.filter(t => t !== null);
      if (validTimes.length > 0) {
        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        const min = Math.min(...validTimes);
        const max = Math.max(...validTimes);

        results.push({
          name: query.name,
          avgTime: Math.round(avg * 100) / 100,
          minTime: Math.round(min * 100) / 100,
          maxTime: Math.round(max * 100) / 100,
          iterations: validTimes.length,
          success: true
        });

        console.log(`     ✅ Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
      } else {
        results.push({
          name: query.name,
          success: false,
          error: 'All iterations failed'
        });
      }
    }

    return results;
  }

  async benchmarkConcurrentQueries() {
    console.log('\n🔄 Running concurrent query benchmarks...');

    const concurrentLevels = [1, 5, 10, 25, 50];
    const results = [];

    for (const concurrency of concurrentLevels) {
      console.log(`   Testing concurrency level: ${concurrency}`);

      const start = performance.now();
      const promises = [];

      for (let i = 0; i < concurrency; i++) {
        promises.push(
          this.prisma.story.findMany({
            take: 10,
            include: {
              author: { select: { id: true, nickname: true } },
              category: { select: { id: true, name: true } }
            }
          })
        );
      }

      try {
        await Promise.all(promises);
        const duration = performance.now() - start;

        results.push({
          concurrency,
          totalTime: Math.round(duration * 100) / 100,
          avgTimePerQuery: Math.round((duration / concurrency) * 100) / 100,
          success: true
        });

        console.log(`     ✅ Total: ${duration.toFixed(2)}ms, Avg per query: ${(duration / concurrency).toFixed(2)}ms`);
      } catch (error) {
        results.push({
          concurrency,
          success: false,
          error: error.message
        });
        console.log(`     ❌ Failed: ${error.message}`);
      }
    }

    return results;
  }

  async benchmarkIndexEfficiency() {
    console.log('\n📈 Analyzing index efficiency...');

    const indexTests = [
      {
        name: 'Story Author Index',
        query: () => this.prisma.story.findMany({
          where: { authorId: 1 },
          take: 10
        })
      },
      {
        name: 'Story Category Index',
        query: () => this.prisma.story.findMany({
          where: { categoryId: 1 },
          take: 10
        })
      },
      {
        name: 'Story Created Date Index',
        query: () => this.prisma.story.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          take: 10
        })
      },
      {
        name: 'Story View Count Index',
        query: () => this.prisma.story.findMany({
          where: {
            viewCount: { gte: 100 }
          },
          take: 10
        })
      },
      {
        name: 'User Session Index',
        query: () => this.prisma.userSession.findMany({
          where: {
            expiresAt: { gte: new Date() }
          },
          take: 10
        })
      }
    ];

    const results = [];

    for (const test of indexTests) {
      console.log(`   Testing: ${test.name}`);

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        try {
          await test.query();
          const duration = performance.now() - start;
          times.push(duration);
        } catch (error) {
          console.error(`     ❌ Error: ${error.message}`);
          times.push(null);
        }
      }

      const validTimes = times.filter(t => t !== null);
      if (validTimes.length > 0) {
        const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
        results.push({
          name: test.name,
          avgTime: Math.round(avg * 100) / 100,
          success: true
        });
        console.log(`     ✅ Average: ${avg.toFixed(2)}ms`);
      } else {
        results.push({
          name: test.name,
          success: false
        });
      }
    }

    return results;
  }

  async analyzeSlowQueries() {
    console.log('\n🐌 Analyzing slow queries...');

    // Sort queries by duration
    const slowQueries = this.queryMetrics
      .filter(q => q.duration > 100) // Queries taking more than 100ms
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // Top 10 slowest

    const analysis = {
      totalQueries: this.queryMetrics.length,
      slowQueries: slowQueries.length,
      averageDuration: this.queryMetrics.length > 0
        ? Math.round((this.queryMetrics.reduce((sum, q) => sum + q.duration, 0) / this.queryMetrics.length) * 100) / 100
        : 0,
      slowestQueries: slowQueries.map(q => ({
        query: q.query.substring(0, 100) + '...',
        duration: q.duration,
        timestamp: new Date(q.timestamp).toISOString()
      }))
    };

    console.log(`   Total queries executed: ${analysis.totalQueries}`);
    console.log(`   Slow queries (>100ms): ${analysis.slowQueries}`);
    console.log(`   Average query duration: ${analysis.averageDuration}ms`);

    return analysis;
  }

  async generatePerformanceReport(basicResults, concurrentResults, indexResults, slowQueryAnalysis) {
    const report = {
      timestamp: new Date().toISOString(),
      testDuration: Date.now() - this.startTime,
      basicQueries: basicResults,
      concurrentQueries: concurrentResults,
      indexEfficiency: indexResults,
      slowQueryAnalysis,
      recommendations: this.generateRecommendations(basicResults, concurrentResults, indexResults, slowQueryAnalysis)
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'performance-analysis', 'reports', `db-benchmark-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📋 Report saved to: ${reportPath}`);
    return report;
  }

  generateRecommendations(basicResults, concurrentResults, indexResults, slowQueryAnalysis) {
    const recommendations = [];

    // Check for slow basic queries
    const slowBasicQueries = basicResults.filter(r => r.success && r.avgTime > 200);
    if (slowBasicQueries.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Query Optimization',
        issue: `${slowBasicQueries.length} basic queries are slow (>200ms)`,
        solution: 'Optimize queries, add missing indexes, or implement caching'
      });
    }

    // Check concurrent performance degradation
    const concurrentDegradation = concurrentResults.filter(r => r.success && r.avgTimePerQuery > 100);
    if (concurrentDegradation.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Concurrency',
        issue: 'Performance degrades significantly under concurrent load',
        solution: 'Optimize connection pool size, implement query caching, or add read replicas'
      });
    }

    // Check index efficiency
    const slowIndexQueries = indexResults.filter(r => r.success && r.avgTime > 50);
    if (slowIndexQueries.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Index Optimization',
        issue: `${slowIndexQueries.length} indexed queries are still slow (>50ms)`,
        solution: 'Review index strategy, consider composite indexes, or optimize query plans'
      });
    }

    // Check slow query percentage
    if (slowQueryAnalysis.slowQueries > slowQueryAnalysis.totalQueries * 0.1) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Query Performance',
        issue: 'More than 10% of queries are slow (>100ms)',
        solution: 'Comprehensive query optimization, database tuning, or caching implementation'
      });
    }

    return recommendations;
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Database Performance Benchmark\n');

  const benchmark = new DatabaseBenchmark();

  try {
    await benchmark.setupMetricsCollection();

    const basicResults = await benchmark.benchmarkBasicQueries();
    const concurrentResults = await benchmark.benchmarkConcurrentQueries();
    const indexResults = await benchmark.benchmarkIndexEfficiency();
    const slowQueryAnalysis = await benchmark.analyzeSlowQueries();

    const report = await benchmark.generatePerformanceReport(
      basicResults,
      concurrentResults,
      indexResults,
      slowQueryAnalysis
    );

    console.log('\n📊 Performance Summary:');
    console.log(`   Basic queries avg: ${basicResults.filter(r => r.success).reduce((sum, r) => sum + r.avgTime, 0) / basicResults.filter(r => r.success).length || 0}ms`);
    console.log(`   Concurrent degradation: ${concurrentResults[concurrentResults.length - 1]?.avgTimePerQuery || 'N/A'}ms per query at max concurrency`);
    console.log(`   Index efficiency: ${indexResults.filter(r => r.success).reduce((sum, r) => sum + r.avgTime, 0) / indexResults.filter(r => r.success).length || 0}ms avg`);
    console.log(`   Slow queries: ${slowQueryAnalysis.slowQueries}/${slowQueryAnalysis.totalQueries} (${((slowQueryAnalysis.slowQueries / slowQueryAnalysis.totalQueries) * 100).toFixed(1)}%)`);

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   [${rec.priority}] ${rec.category}: ${rec.issue}`);
      console.log(`        Solution: ${rec.solution}`);
    });

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
  } finally {
    await benchmark.cleanup();
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default DatabaseBenchmark;