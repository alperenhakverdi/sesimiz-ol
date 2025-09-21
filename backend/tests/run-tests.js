/**
 * Comprehensive Test Runner for Sesimiz Ol API
 * Orchestrates all test suites and generates reports
 */

import { spawn } from 'child_process';
import { generateTestReport, generateHTMLReport } from './test-report-generator.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Test Suite Configuration
 */
const TEST_SUITES = {
  auth: {
    name: 'Authentication & Authorization',
    file: 'auth.test.js',
    priority: 1,
    estimated: '2-3 minutes'
  },
  stories: {
    name: 'Stories Management',
    file: 'stories.test.js',
    priority: 1,
    estimated: '3-4 minutes'
  },
  users: {
    name: 'User Management',
    file: 'users.test.js',
    priority: 1,
    estimated: '2-3 minutes'
  },
  comments: {
    name: 'Comments & Threading',
    file: 'comments.test.js',
    priority: 2,
    estimated: '2 minutes'
  },
  bookmarks: {
    name: 'Bookmarks System',
    file: 'bookmarks.test.js',
    priority: 2,
    estimated: '1-2 minutes'
  },
  upload: {
    name: 'File Upload',
    file: 'upload.test.js',
    priority: 2,
    estimated: '1-2 minutes'
  },
  admin: {
    name: 'Admin Panel',
    file: 'admin.test.js',
    priority: 3,
    estimated: '2 minutes'
  },
  notifications: {
    name: 'Notifications',
    file: 'notifications.test.js',
    priority: 3,
    estimated: '1-2 minutes'
  }
};

/**
 * Test Environment Setup
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-very-long-and-secure';

  console.log('✅ Test environment configured');
}

/**
 * Run a specific test suite
 */
function runTestSuite(suiteName, suiteConfig) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${suiteConfig.name} tests...`);
    console.log(`   File: ${suiteConfig.file}`);
    console.log(`   Estimated time: ${suiteConfig.estimated}`);

    const startTime = Date.now();

    const jestProcess = spawn('npx', [
      'jest',
      `tests/endpoints/${suiteConfig.file}`,
      '--runInBand',
      '--detectOpenHandles',
      '--forceExit',
      '--verbose'
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    jestProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const durationSeconds = Math.round(duration / 1000);

      if (code === 0) {
        console.log(`✅ ${suiteConfig.name} tests completed successfully in ${durationSeconds}s`);
        resolve({
          suite: suiteName,
          success: true,
          duration,
          code
        });
      } else {
        console.log(`❌ ${suiteConfig.name} tests failed with exit code ${code}`);
        resolve({
          suite: suiteName,
          success: false,
          duration,
          code
        });
      }
    });

    jestProcess.on('error', (error) => {
      console.error(`❌ Error running ${suiteConfig.name} tests:`, error);
      reject(error);
    });
  });
}

/**
 * Run all test suites
 */
async function runAllTests(options = {}) {
  const { parallel = false, coverage = false, filter = null } = options;

  await setupTestEnvironment();

  console.log('🚀 Starting comprehensive API testing...');
  console.log(`📋 Test suites to run: ${Object.keys(TEST_SUITES).length}`);
  console.log(`🔄 Execution mode: ${parallel ? 'Parallel' : 'Sequential'}`);
  console.log(`📊 Coverage: ${coverage ? 'Enabled' : 'Disabled'}`);

  const testResults = [];
  const startTime = Date.now();

  // Filter test suites if specified
  const suitesToRun = filter
    ? Object.entries(TEST_SUITES).filter(([name]) => filter.includes(name))
    : Object.entries(TEST_SUITES);

  console.log(`\n📝 Test execution plan:`);
  suitesToRun.forEach(([name, config], index) => {
    console.log(`   ${index + 1}. ${config.name} (${config.estimated})`);
  });

  if (parallel) {
    // Run tests in parallel (faster but may cause resource conflicts)
    console.log('\n⚡ Running tests in parallel...');
    const promises = suitesToRun.map(([name, config]) => runTestSuite(name, config));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const [suiteName] = suitesToRun[index];
      if (result.status === 'fulfilled') {
        testResults.push(result.value);
      } else {
        testResults.push({
          suite: suiteName,
          success: false,
          error: result.reason,
          duration: 0
        });
      }
    });
  } else {
    // Run tests sequentially (more reliable)
    console.log('\n🔄 Running tests sequentially...');
    for (const [name, config] of suitesToRun) {
      try {
        const result = await runTestSuite(name, config);
        testResults.push(result);
      } catch (error) {
        testResults.push({
          suite: name,
          success: false,
          error,
          duration: 0
        });
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const successfulTests = testResults.filter(r => r.success);
  const failedTests = testResults.filter(r => !r.success);

  // Generate summary
  console.log('\n📊 Test Execution Summary');
  console.log('═'.repeat(50));
  console.log(`Total test suites: ${testResults.length}`);
  console.log(`✅ Successful: ${successfulTests.length}`);
  console.log(`❌ Failed: ${failedTests.length}`);
  console.log(`⏱️  Total time: ${Math.round(totalDuration / 1000)}s`);

  if (failedTests.length > 0) {
    console.log('\n❌ Failed Test Suites:');
    failedTests.forEach(result => {
      console.log(`   • ${result.suite} (exit code: ${result.code})`);
    });
  }

  // Run coverage report if requested
  if (coverage) {
    console.log('\n📊 Generating coverage report...');
    await runCoverageReport();
  }

  return {
    success: failedTests.length === 0,
    totalDuration,
    results: testResults,
    summary: {
      total: testResults.length,
      successful: successfulTests.length,
      failed: failedTests.length
    }
  };
}

/**
 * Run specific test suites
 */
async function runSpecificTests(suiteNames) {
  console.log(`🎯 Running specific test suites: ${suiteNames.join(', ')}`);

  const filteredSuites = suiteNames.filter(name => TEST_SUITES[name]);
  const invalidSuites = suiteNames.filter(name => !TEST_SUITES[name]);

  if (invalidSuites.length > 0) {
    console.warn(`⚠️  Invalid test suites ignored: ${invalidSuites.join(', ')}`);
  }

  if (filteredSuites.length === 0) {
    console.error('❌ No valid test suites specified');
    return { success: false };
  }

  return await runAllTests({ filter: filteredSuites });
}

/**
 * Run coverage report
 */
async function runCoverageReport() {
  return new Promise((resolve, reject) => {
    console.log('📊 Generating Jest coverage report...');

    const jestProcess = spawn('npx', [
      'jest',
      '--coverage',
      '--runInBand',
      '--detectOpenHandles',
      '--forceExit'
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    jestProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Coverage report generated successfully');
        console.log('📂 Coverage files available in ./coverage/ directory');
        resolve();
      } else {
        console.log(`❌ Coverage generation failed with exit code ${code}`);
        resolve(); // Don't fail the entire process
      }
    });

    jestProcess.on('error', (error) => {
      console.error('❌ Error generating coverage:', error);
      resolve(); // Don't fail the entire process
    });
  });
}

/**
 * Generate comprehensive test documentation
 */
async function generateTestDocumentation() {
  console.log('📚 Generating test documentation...');

  try {
    const report = await generateTestReport();
    const htmlReport = await generateHTMLReport(report);

    // Create documentation directory
    const docsDir = path.join(process.cwd(), 'tests', 'docs');
    await fs.mkdir(docsDir, { recursive: true });

    // Save reports
    await fs.writeFile(
      path.join(docsDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );

    await fs.writeFile(
      path.join(docsDir, 'test-report.html'),
      htmlReport
    );

    // Generate API endpoints documentation
    const apiDocsPath = path.join(docsDir, 'api-endpoints.md');
    await generateAPIDocumentation(apiDocsPath);

    console.log('✅ Test documentation generated successfully');
    console.log(`📊 HTML Report: ${path.join(docsDir, 'test-report.html')}`);
    console.log(`📝 JSON Report: ${path.join(docsDir, 'test-report.json')}`);
    console.log(`📋 API Docs: ${apiDocsPath}`);

    return true;
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
    return false;
  }
}

/**
 * Generate API endpoints documentation
 */
async function generateAPIDocumentation(filePath) {
  const { API_ENDPOINTS } = await import('./test-report-generator.js');

  let content = `# Sesimiz Ol API Endpoints Documentation

Generated: ${new Date().toISOString()}

## Overview

This document provides comprehensive information about all API endpoints in the Sesimiz Ol platform, including their test coverage status and implementation details.

### Summary Statistics

`;

  // Calculate summary stats
  let totalEndpoints = 0;
  Object.values(API_ENDPOINTS).forEach(module => {
    totalEndpoints += module.endpoints.length;
  });

  content += `- **Total Endpoints**: ${totalEndpoints}\n`;
  content += `- **Modules**: ${Object.keys(API_ENDPOINTS).length}\n`;
  content += `- **Test Coverage**: Comprehensive test suites covering all endpoints\n\n`;

  // Generate module documentation
  Object.entries(API_ENDPOINTS).forEach(([moduleName, moduleData]) => {
    content += `## ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module\n\n`;

    content += `| Method | Endpoint | Description | Test Coverage |\n`;
    content += `|--------|----------|-------------|---------------|\n`;

    moduleData.endpoints.forEach(endpoint => {
      const coverageIcon = endpoint.testCoverage >= 95 ? '🟢' :
                          endpoint.testCoverage >= 85 ? '🟡' :
                          endpoint.testCoverage >= 75 ? '🟠' : '🔴';

      content += `| \`${endpoint.method}\` | \`${endpoint.path}\` | ${endpoint.description} | ${coverageIcon} ${endpoint.testCoverage}% |\n`;
    });

    content += '\n';
  });

  content += `## Test Coverage Legend

- 🟢 **Excellent** (95%+): Comprehensive test coverage
- 🟡 **Good** (85-94%): Good test coverage with minor gaps
- 🟠 **Fair** (75-84%): Adequate coverage but needs improvement
- 🔴 **Poor** (<75%): Requires significant testing improvements

## Testing Guidelines

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run specific module tests
npm run test:auth
npm run test:stories
npm run test:users

# Run with coverage
npm run test:coverage

# Generate test report
node tests/run-tests.js --docs
\`\`\`

### Test Structure

Each endpoint is tested for:

1. **Functionality**: Core business logic
2. **Authentication**: Access control and token validation
3. **Authorization**: Role and permission verification
4. **Validation**: Input validation and error handling
5. **Security**: SQL injection, XSS, and other security vectors
6. **Performance**: Response time and resource usage
7. **Edge Cases**: Boundary conditions and error scenarios

### Continuous Integration

Tests are automatically run on:
- Pull request creation
- Code push to main branch
- Scheduled daily runs
- Pre-deployment validation

For more details, see the test implementation files in \`tests/endpoints/\`.
`;

  await fs.writeFile(filePath, content);
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    parallel: args.includes('--parallel'),
    coverage: args.includes('--coverage'),
    docs: args.includes('--docs'),
    specific: args.find(arg => arg.startsWith('--suites='))?.split('=')[1]?.split(',')
  };

  console.log('🧪 Sesimiz Ol API Test Runner');
  console.log('════════════════════════════════\n');

  try {
    let testResult;

    if (options.docs) {
      // Generate documentation only
      const success = await generateTestDocumentation();
      process.exit(success ? 0 : 1);
    } else if (options.specific) {
      // Run specific test suites
      testResult = await runSpecificTests(options.specific);
    } else {
      // Run all tests
      testResult = await runAllTests(options);
    }

    // Always generate documentation after tests
    await generateTestDocumentation();

    console.log('\n🎉 Test execution completed!');
    console.log('📚 Documentation updated automatically');

    process.exit(testResult.success ? 0 : 1);

  } catch (error) {
    console.error('❌ Fatal error during test execution:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export {
  runAllTests,
  runSpecificTests,
  generateTestDocumentation,
  TEST_SUITES
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}