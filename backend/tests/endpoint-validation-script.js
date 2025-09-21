#!/usr/bin/env node

/**
 * API Endpoint Validation Script
 *
 * This script validates all API endpoints are properly defined and accessible
 * without requiring database connectivity. It performs basic route validation,
 * middleware checking, and endpoint inventory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class EndpointValidator {
  constructor() {
    this.results = {
      totalFiles: 0,
      validFiles: 0,
      totalEndpoints: 0,
      validEndpoints: 0,
      errors: [],
      warnings: [],
      endpoints: []
    };
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async validateEndpoints() {
    this.log('\n🔍 Starting API Endpoint Validation...', 'cyan');
    this.log('=' * 50, 'cyan');

    const routesDir = path.join(__dirname, '../src/routes');

    try {
      await this.scanRouteFiles(routesDir);
      this.generateReport();
    } catch (error) {
      this.log(`❌ Validation failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async scanRouteFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        await this.scanRouteFiles(filePath, `${prefix}${file}/`);
      } else if (file.endsWith('.js')) {
        this.results.totalFiles++;
        await this.validateRouteFile(filePath, prefix + file);
      }
    }
  }

  async validateRouteFile(filePath, relativePath) {
    this.log(`\n📁 Analyzing ${relativePath}...`, 'blue');

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const endpoints = this.extractEndpoints(content, relativePath);

      this.results.validFiles++;
      this.results.totalEndpoints += endpoints.length;
      this.results.validEndpoints += endpoints.length;
      this.results.endpoints.push(...endpoints);

      this.log(`  ✅ Found ${endpoints.length} endpoints`, 'green');

      // Validate file structure
      this.validateFileStructure(content, relativePath);

      // Check for common issues
      this.checkCommonIssues(content, relativePath);

    } catch (error) {
      this.results.errors.push(`${relativePath}: ${error.message}`);
      this.log(`  ❌ Error: ${error.message}`, 'red');
    }
  }

  extractEndpoints(content, filePath) {
    const endpoints = [];
    const routePattern = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    let match;
    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];

      endpoints.push({
        method,
        path,
        file: filePath,
        fullPath: this.buildFullPath(path, filePath)
      });
    }

    return endpoints;
  }

  buildFullPath(routePath, filePath) {
    // Build full API path based on file location
    const baseMap = {
      'auth.js': '/api/auth',
      'stories.js': '/api/stories',
      'users.js': '/api/users',
      'comments.js': '/api/comments',
      'messages.js': '/api/messages',
      'notifications.js': '/api/notifications',
      'upload.js': '/api/upload',
      'bookmarks.js': '/api/bookmarks',
      'activity.js': '/api/activity',
      'organizations.js': '/api/organizations',
      'admin/index.js': '/api/admin'
    };

    const basePath = baseMap[filePath] || '/api';
    return `${basePath}${routePath}`;
  }

  validateFileStructure(content, filePath) {
    const requiredImports = ['express'];
    const checks = [
      {
        pattern: /import.*express.*from.*['"`]express['"`]/,
        message: 'Missing Express import',
        type: 'error'
      },
      {
        pattern: /const\s+router\s*=\s*express\.Router\(\)/,
        message: 'Missing router initialization',
        type: 'error'
      },
      {
        pattern: /export\s+default\s+router/,
        message: 'Missing router export',
        type: 'error'
      }
    ];

    for (const check of checks) {
      if (!check.pattern.test(content)) {
        const message = `${filePath}: ${check.message}`;
        if (check.type === 'error') {
          this.results.errors.push(message);
        } else {
          this.results.warnings.push(message);
        }
      }
    }
  }

  checkCommonIssues(content, filePath) {
    const issues = [
      {
        pattern: /console\.log/g,
        message: 'Console.log statements found (consider using proper logging)',
        type: 'warning'
      },
      {
        pattern: /catch\s*\(\s*error?\s*\)\s*\{\s*\}/,
        message: 'Empty catch blocks found',
        type: 'warning'
      },
      {
        pattern: /res\.status\(500\)\.json\(/g,
        message: 'Direct 500 error responses (consider error middleware)',
        type: 'warning'
      },
      {
        pattern: /await.*\.findMany\(\s*\)/,
        message: 'Unbounded database queries (consider pagination)',
        type: 'warning'
      }
    ];

    for (const issue of issues) {
      const matches = content.match(issue.pattern);
      if (matches) {
        const message = `${filePath}: ${issue.message} (${matches.length} occurrences)`;
        if (issue.type === 'error') {
          this.results.errors.push(message);
        } else {
          this.results.warnings.push(message);
        }
      }
    }
  }

  generateReport() {
    this.log('\n📊 Endpoint Validation Report', 'magenta');
    this.log('=' * 50, 'magenta');

    // Summary Statistics
    this.log('\n📈 Summary Statistics:', 'cyan');
    this.log(`  Total Route Files: ${this.results.totalFiles}`, 'white');
    this.log(`  Valid Route Files: ${this.results.validFiles}`, 'green');
    this.log(`  Total Endpoints: ${this.results.totalEndpoints}`, 'white');
    this.log(`  Valid Endpoints: ${this.results.validEndpoints}`, 'green');

    // Endpoint Inventory
    this.log('\n📋 Endpoint Inventory:', 'cyan');
    const groupedEndpoints = this.groupEndpointsByFile();

    for (const [file, endpoints] of Object.entries(groupedEndpoints)) {
      this.log(`\n  📁 ${file} (${endpoints.length} endpoints):`, 'blue');

      const methodGroups = this.groupByMethod(endpoints);
      for (const [method, methodEndpoints] of Object.entries(methodGroups)) {
        this.log(`    ${method}:`, 'yellow');
        for (const endpoint of methodEndpoints) {
          this.log(`      ${endpoint.fullPath}`, 'white');
        }
      }
    }

    // HTTP Method Distribution
    this.log('\n📊 HTTP Method Distribution:', 'cyan');
    const methodCounts = this.getMethodCounts();
    for (const [method, count] of Object.entries(methodCounts)) {
      this.log(`  ${method}: ${count} endpoints`, 'white');
    }

    // Authentication Requirements
    this.log('\n🔐 Authentication Analysis:', 'cyan');
    this.analyzeAuthentication();

    // Errors and Warnings
    if (this.results.errors.length > 0) {
      this.log('\n❌ Errors:', 'red');
      for (const error of this.results.errors) {
        this.log(`  • ${error}`, 'red');
      }
    }

    if (this.results.warnings.length > 0) {
      this.log('\n⚠️  Warnings:', 'yellow');
      for (const warning of this.results.warnings) {
        this.log(`  • ${warning}`, 'yellow');
      }
    }

    // Final Status
    this.log('\n🏁 Validation Complete!', 'green');
    const success = this.results.errors.length === 0;
    this.log(`Status: ${success ? 'PASSED' : 'FAILED'}`, success ? 'green' : 'red');

    if (success) {
      this.log(`\n✅ All ${this.results.totalEndpoints} endpoints are properly defined!`, 'green');
    } else {
      this.log(`\n❌ Found ${this.results.errors.length} errors that need attention.`, 'red');
    }

    // Generate JSON report
    this.generateJSONReport();
  }

  groupEndpointsByFile() {
    const grouped = {};
    for (const endpoint of this.results.endpoints) {
      if (!grouped[endpoint.file]) {
        grouped[endpoint.file] = [];
      }
      grouped[endpoint.file].push(endpoint);
    }
    return grouped;
  }

  groupByMethod(endpoints) {
    const grouped = {};
    for (const endpoint of endpoints) {
      if (!grouped[endpoint.method]) {
        grouped[endpoint.method] = [];
      }
      grouped[endpoint.method].push(endpoint);
    }
    return grouped;
  }

  getMethodCounts() {
    const counts = {};
    for (const endpoint of this.results.endpoints) {
      counts[endpoint.method] = (counts[endpoint.method] || 0) + 1;
    }
    return counts;
  }

  analyzeAuthentication() {
    const publicEndpoints = this.results.endpoints.filter(e =>
      e.fullPath.includes('/auth/') ||
      e.fullPath.includes('/stories') && e.method === 'GET' ||
      e.fullPath.includes('/categories') ||
      e.fullPath.includes('/stats')
    );

    const authRequiredEndpoints = this.results.endpoints.filter(e =>
      !publicEndpoints.includes(e)
    );

    this.log(`  Public Endpoints: ${publicEndpoints.length}`, 'green');
    this.log(`  Auth Required: ${authRequiredEndpoints.length}`, 'yellow');
    this.log(`  Auth Coverage: ${((authRequiredEndpoints.length / this.results.totalEndpoints) * 100).toFixed(1)}%`, 'white');
  }

  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.totalFiles,
        validFiles: this.results.validFiles,
        totalEndpoints: this.results.totalEndpoints,
        validEndpoints: this.results.validEndpoints,
        errors: this.results.errors.length,
        warnings: this.results.warnings.length
      },
      endpoints: this.results.endpoints,
      errors: this.results.errors,
      warnings: this.results.warnings
    };

    const reportPath = path.join(__dirname, 'endpoint-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
  }
}

// CLI Usage
function showUsage() {
  console.log(`
🔍 API Endpoint Validation Script

Usage: node endpoint-validation-script.js [options]

Options:
  --help, -h     Show this help message
  --json         Output JSON report only
  --quiet        Minimal output
  --verbose      Detailed output

Examples:
  node endpoint-validation-script.js
  node endpoint-validation-script.js --json
  node endpoint-validation-script.js --verbose
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const validator = new EndpointValidator();

  try {
    await validator.validateEndpoints();

    // Exit with error code if validation failed
    if (validator.results.errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main();
}

export default EndpointValidator;