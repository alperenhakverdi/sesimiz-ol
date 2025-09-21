#!/usr/bin/env node

/**
 * Database Health Check Script for Sesimiz Ol
 *
 * This script performs a comprehensive health check of the PostgreSQL database
 * using Prisma ORM and provides actionable insights for production readiness.
 *
 * Usage:
 *   node scripts/database/health-check.js
 *   node scripts/database/health-check.js --verbose
 *   node scripts/database/health-check.js --format=json
 *
 * Requirements:
 *   - Prisma Client configured and connected
 *   - DATABASE_URL environment variable set
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  verbose: process.argv.includes('--verbose'),
  format: process.argv.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'text',
  thresholds: {
    cacheHitRatio: 95,
    deadRowPercentage: 20,
    indexUsageThreshold: 100,
    maxConnectionAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  }
};

// Health check results
const healthResults = {
  timestamp: new Date().toISOString(),
  overall: 'UNKNOWN',
  checks: [],
  recommendations: [],
  metrics: {},
  errors: []
};

/**
 * Log messages based on verbosity setting
 */
function log(message, level = 'info') {
  if (CONFIG.verbose || level === 'error') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

/**
 * Add a health check result
 */
function addCheck(name, status, message, details = null) {
  const check = { name, status, message, details };
  healthResults.checks.push(check);

  if (CONFIG.verbose) {
    log(`Health Check: ${name} - ${status} - ${message}`);
  }

  return check;
}

/**
 * Add a recommendation
 */
function addRecommendation(category, priority, description, action = null) {
  const recommendation = { category, priority, description, action };
  healthResults.recommendations.push(recommendation);

  if (CONFIG.verbose) {
    log(`Recommendation [${priority}]: ${description}`);
  }

  return recommendation;
}

/**
 * Check database connectivity and basic metrics
 */
async function checkDatabaseConnectivity() {
  try {
    log('Checking database connectivity...');

    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    addCheck('Database Connectivity', 'PASS', 'Successfully connected to database');

    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    const version = versionResult[0]?.version || 'Unknown';
    healthResults.metrics.databaseVersion = version;
    addCheck('Database Version', 'INFO', `PostgreSQL version: ${version}`);

    // Get database size
    const sizeResult = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const dbSize = sizeResult[0]?.size || 'Unknown';
    healthResults.metrics.databaseSize = dbSize;
    addCheck('Database Size', 'INFO', `Total database size: ${dbSize}`);

    return true;
  } catch (error) {
    addCheck('Database Connectivity', 'FAIL', `Failed to connect: ${error.message}`);
    healthResults.errors.push(`Database connectivity error: ${error.message}`);
    return false;
  }
}

/**
 * Check table statistics and integrity
 */
async function checkTableStatistics() {
  try {
    log('Checking table statistics...');

    // Get table statistics
    const tableStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        last_vacuum,
        last_autovacuum,
        CASE
          WHEN n_live_tup > 0 THEN round((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2)
          ELSE 0
        END as dead_row_percentage
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;

    healthResults.metrics.tableCount = tableStats.length;
    healthResults.metrics.totalLiveRows = tableStats.reduce((sum, table) => sum + Number(table.live_rows || 0), 0);
    healthResults.metrics.totalDeadRows = tableStats.reduce((sum, table) => sum + Number(table.dead_rows || 0), 0);

    // Check for tables with high dead row percentage
    const problematicTables = tableStats.filter(table =>
      Number(table.dead_row_percentage || 0) > CONFIG.thresholds.deadRowPercentage
    );

    if (problematicTables.length > 0) {
      addCheck('Dead Row Analysis', 'WARN',
        `${problematicTables.length} tables have high dead row percentage`,
        problematicTables.map(t => `${t.tablename}: ${t.dead_row_percentage}%`)
      );

      addRecommendation('MAINTENANCE', 'HIGH',
        'Some tables have high dead row percentages and need vacuum',
        `VACUUM ANALYZE ${problematicTables.map(t => t.tablename).join(', ')}`
      );
    } else {
      addCheck('Dead Row Analysis', 'PASS', 'All tables have acceptable dead row percentages');
    }

    // Check for never-vacuumed tables
    const neverVacuumed = tableStats.filter(table =>
      !table.last_vacuum && !table.last_autovacuum && Number(table.live_rows || 0) > 100
    );

    if (neverVacuumed.length > 0) {
      addCheck('Vacuum Status', 'WARN',
        `${neverVacuumed.length} tables have never been vacuumed`,
        neverVacuumed.map(t => t.tablename)
      );
    } else {
      addCheck('Vacuum Status', 'PASS', 'All significant tables have been vacuumed');
    }

    return true;
  } catch (error) {
    addCheck('Table Statistics', 'FAIL', `Failed to check table statistics: ${error.message}`);
    healthResults.errors.push(`Table statistics error: ${error.message}`);
    return false;
  }
}

/**
 * Check foreign key constraints and data integrity
 */
async function checkDataIntegrity() {
  try {
    log('Checking data integrity...');

    // Check for orphaned records in key relationships
    const checks = [
      {
        name: 'Stories without authors',
        query: `
          SELECT count(*) as count
          FROM stories s
          LEFT JOIN users u ON s."authorId" = u.id
          WHERE u.id IS NULL
        `
      },
      {
        name: 'Comments without authors',
        query: `
          SELECT count(*) as count
          FROM comments c
          LEFT JOIN users u ON c."authorId" = u.id
          WHERE u.id IS NULL
        `
      },
      {
        name: 'Comments without stories',
        query: `
          SELECT count(*) as count
          FROM comments c
          LEFT JOIN stories s ON c."storyId" = s.id
          WHERE s.id IS NULL
        `
      },
      {
        name: 'Sessions without users',
        query: `
          SELECT count(*) as count
          FROM user_sessions s
          LEFT JOIN users u ON s."userId" = u.id
          WHERE u.id IS NULL
        `
      }
    ];

    let integrityPassed = true;

    for (const check of checks) {
      try {
        const result = await prisma.$queryRawUnsafe(check.query);
        const count = Number(result[0]?.count || 0);

        if (count > 0) {
          addCheck(check.name, 'FAIL', `Found ${count} orphaned records`);
          integrityPassed = false;
          addRecommendation('DATA_INTEGRITY', 'HIGH',
            `Clean up orphaned records: ${check.name}`,
            'Run cleanup procedures to remove orphaned data'
          );
        } else {
          addCheck(check.name, 'PASS', 'No orphaned records found');
        }
      } catch (error) {
        addCheck(check.name, 'ERROR', `Failed to check: ${error.message}`);
        integrityPassed = false;
      }
    }

    return integrityPassed;
  } catch (error) {
    addCheck('Data Integrity', 'FAIL', `Failed to check data integrity: ${error.message}`);
    healthResults.errors.push(`Data integrity error: ${error.message}`);
    return false;
  }
}

/**
 * Check index usage and performance
 */
async function checkIndexPerformance() {
  try {
    log('Checking index performance...');

    // Get index usage statistics
    const indexStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `;

    healthResults.metrics.indexCount = indexStats.length;

    // Check for unused indexes
    const unusedIndexes = indexStats.filter(index =>
      Number(index.scans || 0) === 0 &&
      index.index_size !== '0 bytes'
    );

    if (unusedIndexes.length > 0) {
      addCheck('Unused Indexes', 'WARN',
        `Found ${unusedIndexes.length} unused indexes consuming space`,
        unusedIndexes.map(i => `${i.indexname} (${i.index_size})`)
      );

      addRecommendation('PERFORMANCE', 'MEDIUM',
        'Consider removing unused indexes to save space',
        'Review and drop indexes that are never used'
      );
    } else {
      addCheck('Unused Indexes', 'PASS', 'All indexes are being used');
    }

    // Check for low-usage indexes
    const lowUsageIndexes = indexStats.filter(index => {
      const scans = Number(index.scans || 0);
      return scans > 0 && scans < CONFIG.thresholds.indexUsageThreshold;
    });

    if (lowUsageIndexes.length > 0) {
      addCheck('Low Usage Indexes', 'INFO',
        `Found ${lowUsageIndexes.length} indexes with low usage`,
        lowUsageIndexes.map(i => `${i.indexname} (${i.scans} scans)`)
      );
    }

    return true;
  } catch (error) {
    addCheck('Index Performance', 'FAIL', `Failed to check index performance: ${error.message}`);
    healthResults.errors.push(`Index performance error: ${error.message}`);
    return false;
  }
}

/**
 * Check cache hit ratios
 */
async function checkCachePerformance() {
  try {
    log('Checking cache performance...');

    // Get buffer cache hit ratio
    const cacheStats = await prisma.$queryRaw`
      SELECT
        round(
          (sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2
        ) as hit_ratio
      FROM pg_statio_user_tables
    `;

    const hitRatio = Number(cacheStats[0]?.hit_ratio || 0);
    healthResults.metrics.cacheHitRatio = hitRatio;

    if (hitRatio >= CONFIG.thresholds.cacheHitRatio) {
      addCheck('Cache Hit Ratio', 'PASS', `Excellent cache hit ratio: ${hitRatio}%`);
    } else if (hitRatio >= 90) {
      addCheck('Cache Hit Ratio', 'WARN', `Good cache hit ratio: ${hitRatio}%`);
      addRecommendation('PERFORMANCE', 'MEDIUM',
        'Consider increasing shared_buffers for better cache performance',
        'Tune PostgreSQL shared_buffers configuration'
      );
    } else {
      addCheck('Cache Hit Ratio', 'FAIL', `Poor cache hit ratio: ${hitRatio}%`);
      addRecommendation('PERFORMANCE', 'HIGH',
        'Database cache performance is poor - increase shared_buffers',
        'Significantly increase PostgreSQL shared_buffers configuration'
      );
    }

    return true;
  } catch (error) {
    addCheck('Cache Performance', 'FAIL', `Failed to check cache performance: ${error.message}`);
    healthResults.errors.push(`Cache performance error: ${error.message}`);
    return false;
  }
}

/**
 * Check for expired and stale data
 */
async function checkDataFreshness() {
  try {
    log('Checking data freshness...');

    // Check for expired password reset tokens
    const expiredTokens = await prisma.passwordResetToken.count({
      where: {
        expiresAt: {
          lt: new Date()
        },
        consumedAt: null
      }
    });

    if (expiredTokens > 0) {
      addCheck('Expired Password Tokens', 'WARN',
        `Found ${expiredTokens} expired password reset tokens`);
      addRecommendation('MAINTENANCE', 'MEDIUM',
        'Clean up expired password reset tokens',
        'Run cleanup procedures to remove old tokens'
      );
    } else {
      addCheck('Expired Password Tokens', 'PASS', 'No expired password reset tokens');
    }

    // Check for expired user sessions
    const expiredSessions = await prisma.userSession.count({
      where: {
        expiresAt: {
          lt: new Date()
        },
        revokedAt: null
      }
    });

    if (expiredSessions > 0) {
      addCheck('Expired User Sessions', 'WARN',
        `Found ${expiredSessions} expired user sessions`);
      addRecommendation('MAINTENANCE', 'MEDIUM',
        'Clean up expired user sessions',
        'Run cleanup procedures to remove old sessions'
      );
    } else {
      addCheck('Expired User Sessions', 'PASS', 'No expired user sessions');
    }

    return true;
  } catch (error) {
    addCheck('Data Freshness', 'FAIL', `Failed to check data freshness: ${error.message}`);
    healthResults.errors.push(`Data freshness error: ${error.message}`);
    return false;
  }
}

/**
 * Check application-level metrics
 */
async function checkApplicationMetrics() {
  try {
    log('Checking application metrics...');

    // Get user statistics
    const userStats = await prisma.user.groupBy({
      by: ['isActive', 'isBanned'],
      _count: true
    });

    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count, 0);
    const activeUsers = userStats.find(s => s.isActive && !s.isBanned)?._count || 0;
    const bannedUsers = userStats.find(s => s.isBanned)?._count || 0;

    healthResults.metrics.totalUsers = totalUsers;
    healthResults.metrics.activeUsers = activeUsers;
    healthResults.metrics.bannedUsers = bannedUsers;

    addCheck('User Statistics', 'INFO',
      `Total: ${totalUsers}, Active: ${activeUsers}, Banned: ${bannedUsers}`);

    // Get story statistics
    const storyStats = await prisma.story.groupBy({
      by: ['isPublished'],
      _count: true
    });

    const totalStories = storyStats.reduce((sum, stat) => sum + stat._count, 0);
    const publishedStories = storyStats.find(s => s.isPublished)?._count || 0;

    healthResults.metrics.totalStories = totalStories;
    healthResults.metrics.publishedStories = publishedStories;

    addCheck('Story Statistics', 'INFO',
      `Total: ${totalStories}, Published: ${publishedStories}`);

    // Check for data consistency
    const storiesWithIncorrectCounts = await prisma.$queryRaw`
      SELECT count(*) as count
      FROM stories s
      WHERE s."viewCount" != (
        SELECT count(*) FROM story_views sv WHERE sv."storyId" = s.id
      )
    `;

    const inconsistentCount = Number(storiesWithIncorrectCounts[0]?.count || 0);

    if (inconsistentCount > 0) {
      addCheck('Data Consistency', 'WARN',
        `Found ${inconsistentCount} stories with incorrect view counts`);
      addRecommendation('DATA_INTEGRITY', 'MEDIUM',
        'Update story view counts to match actual views',
        'Run count update procedures'
      );
    } else {
      addCheck('Data Consistency', 'PASS', 'Story view counts are consistent');
    }

    return true;
  } catch (error) {
    addCheck('Application Metrics', 'FAIL', `Failed to check application metrics: ${error.message}`);
    healthResults.errors.push(`Application metrics error: ${error.message}`);
    return false;
  }
}

/**
 * Determine overall health status
 */
function determineOverallHealth() {
  const failCount = healthResults.checks.filter(check => check.status === 'FAIL').length;
  const warnCount = healthResults.checks.filter(check => check.status === 'WARN').length;
  const errorCount = healthResults.errors.length;

  if (failCount > 0 || errorCount > 0) {
    healthResults.overall = 'CRITICAL';
  } else if (warnCount > 2) {
    healthResults.overall = 'WARNING';
  } else if (warnCount > 0) {
    healthResults.overall = 'CAUTION';
  } else {
    healthResults.overall = 'HEALTHY';
  }

  healthResults.metrics.checksPassed = healthResults.checks.filter(c => c.status === 'PASS').length;
  healthResults.metrics.checksWarned = warnCount;
  healthResults.metrics.checksFailed = failCount;
  healthResults.metrics.checksTotal = healthResults.checks.length;
}

/**
 * Output results in the specified format
 */
function outputResults() {
  if (CONFIG.format === 'json') {
    console.log(JSON.stringify(healthResults, null, 2));
  } else {
    // Text format output
    console.log('\n='.repeat(80));
    console.log('DATABASE HEALTH CHECK REPORT');
    console.log('='.repeat(80));
    console.log(`Timestamp: ${healthResults.timestamp}`);
    console.log(`Overall Status: ${healthResults.overall}`);
    console.log(`Total Checks: ${healthResults.metrics.checksTotal}`);
    console.log(`Passed: ${healthResults.metrics.checksPassed}`);
    console.log(`Warnings: ${healthResults.metrics.checksWarned}`);
    console.log(`Failed: ${healthResults.metrics.checksFailed}`);

    if (healthResults.errors.length > 0) {
      console.log('\nERRORS:');
      healthResults.errors.forEach(error => console.log(`  ❌ ${error}`));
    }

    console.log('\nCHECK RESULTS:');
    healthResults.checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' :
                   check.status === 'WARN' ? '⚠️' :
                   check.status === 'FAIL' ? '❌' : 'ℹ️';
      console.log(`  ${icon} ${check.name}: ${check.message}`);

      if (check.details && CONFIG.verbose) {
        if (Array.isArray(check.details)) {
          check.details.forEach(detail => console.log(`     - ${detail}`));
        } else {
          console.log(`     - ${check.details}`);
        }
      }
    });

    if (healthResults.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      const priorities = ['HIGH', 'MEDIUM', 'LOW'];
      priorities.forEach(priority => {
        const recs = healthResults.recommendations.filter(r => r.priority === priority);
        if (recs.length > 0) {
          console.log(`  ${priority} Priority:`);
          recs.forEach(rec => {
            console.log(`    • ${rec.description}`);
            if (rec.action && CONFIG.verbose) {
              console.log(`      Action: ${rec.action}`);
            }
          });
        }
      });
    }

    console.log('\nKEY METRICS:');
    Object.entries(healthResults.metrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n' + '='.repeat(80));
  }
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  try {
    log('Starting database health check...');

    const checks = [
      checkDatabaseConnectivity,
      checkTableStatistics,
      checkDataIntegrity,
      checkIndexPerformance,
      checkCachePerformance,
      checkDataFreshness,
      checkApplicationMetrics
    ];

    let allChecksPassed = true;

    for (const check of checks) {
      try {
        const result = await check();
        if (!result) allChecksPassed = false;
      } catch (error) {
        log(`Health check failed: ${error.message}`, 'error');
        healthResults.errors.push(`Health check error: ${error.message}`);
        allChecksPassed = false;
      }
    }

    determineOverallHealth();
    outputResults();

    // Exit with appropriate code
    const exitCode = healthResults.overall === 'CRITICAL' ? 1 : 0;

    log(`Health check completed with status: ${healthResults.overall}`);
    process.exit(exitCode);

  } catch (error) {
    console.error('Fatal error during health check:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  log('Health check interrupted');
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('Health check terminated');
  await prisma.$disconnect();
  process.exit(1);
});

// Run the health check
runHealthCheck().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});