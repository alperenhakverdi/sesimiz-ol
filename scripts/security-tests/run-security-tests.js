#!/usr/bin/env node

/**
 * Comprehensive Security Test Suite Runner
 * Runs all security tests and generates a consolidated report
 */

import AuthenticationSecurityTester from './01-authentication-security-test.js';
import InputValidationTester from './02-input-validation-test.js';
import AuthorizationTester from './03-authorization-test.js';
import FileUploadSecurityTester from './04-file-upload-security-test.js';
import fs from 'fs/promises';
import path from 'path';

class SecurityTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: {
        apiBase: process.env.API_BASE || 'http://localhost:3001/api',
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      summary: {
        totalSuites: 0,
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalCritical: 0,
        overallRiskLevel: 'UNKNOWN'
      },
      suites: []
    };
  }

  log(message) {
    console.log(`[SECURITY-RUNNER] ${message}`);
  }

  async runAllTests() {
    console.log('\\n🔒 SESIMIZ OL SECURITY TEST SUITE');
    console.log('===================================\\n');

    const testSuites = [
      { name: 'Authentication Security', tester: AuthenticationSecurityTester },
      { name: 'Input Validation Security', tester: InputValidationTester },
      { name: 'Authorization Security', tester: AuthorizationTester },
      { name: 'File Upload Security', tester: FileUploadSecurityTester }
    ];

    for (const suite of testSuites) {
      console.log(`\\n🧪 Running ${suite.name} Tests...`);
      console.log('─'.repeat(50));

      try {
        const tester = new suite.tester();
        await tester.runAllTests();

        // Collect results
        this.results.suites.push(tester.results);
        this.results.summary.totalSuites++;
        this.results.summary.totalTests += tester.results.summary.total;
        this.results.summary.totalPassed += tester.results.summary.passed;
        this.results.summary.totalFailed += tester.results.summary.failed;
        this.results.summary.totalCritical += tester.results.summary.critical;

      } catch (error) {
        console.error(`❌ Error running ${suite.name}: ${error.message}`);
        this.results.suites.push({
          testSuite: suite.name,
          error: error.message,
          summary: { total: 0, passed: 0, failed: 1, critical: 1 }
        });
        this.results.summary.totalSuites++;
        this.results.summary.totalFailed++;
        this.results.summary.totalCritical++;
      }
    }

    this.calculateOverallRiskLevel();
    await this.generateConsolidatedReport();
    this.printFinalSummary();
  }

  calculateOverallRiskLevel() {
    const { totalTests, totalFailed, totalCritical } = this.results.summary;

    if (totalCritical > 0) {
      this.results.summary.overallRiskLevel = 'CRITICAL';
    } else if (totalFailed > totalTests * 0.3) {
      this.results.summary.overallRiskLevel = 'HIGH';
    } else if (totalFailed > totalTests * 0.1) {
      this.results.summary.overallRiskLevel = 'MEDIUM';
    } else if (totalFailed > 0) {
      this.results.summary.overallRiskLevel = 'LOW';
    } else {
      this.results.summary.overallRiskLevel = 'MINIMAL';
    }
  }

  async generateConsolidatedReport() {
    const reportData = {
      ...this.results,
      recommendations: this.generateRecommendations(),
      criticalIssues: this.extractCriticalIssues(),
      securityScore: this.calculateSecurityScore()
    };

    // Save JSON report
    const jsonFilename = `./security-test-report-${new Date().toISOString().split('T')[0]}.json`;
    await fs.writeFile(jsonFilename, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    await this.generateHtmlReport(reportData);

    this.log(`Consolidated report saved to ${jsonFilename}`);
  }

  generateRecommendations() {
    const recommendations = [];

    for (const suite of this.results.suites) {
      if (suite.tests) {
        for (const test of suite.tests) {
          if (test.status === 'FAIL') {
            const recommendation = this.getRecommendationForTest(test);
            if (recommendation) {
              recommendations.push(recommendation);
            }
          }
        }
      }
    }

    return recommendations;
  }

  getRecommendationForTest(test) {
    const recommendations = {
      'Weak Password Rejection': {
        priority: 'HIGH',
        action: 'Implement stronger password complexity validation',
        implementation: 'Update password validator regex and add dictionary checks'
      },
      'Brute Force Protection': {
        priority: 'CRITICAL',
        action: 'Implement account lockout mechanism',
        implementation: 'Add failed login tracking and temporary account locks'
      },
      'JWT Token Validation': {
        priority: 'CRITICAL',
        action: 'Fix JWT token validation logic',
        implementation: 'Ensure all invalid tokens are properly rejected'
      },
      'XSS Protection': {
        priority: 'CRITICAL',
        action: 'Implement content sanitization',
        implementation: 'Add HTML sanitization for all user-generated content'
      },
      'SQL Injection Protection': {
        priority: 'CRITICAL',
        action: 'Review database query implementation',
        implementation: 'Ensure all queries use parameterized statements'
      },
      'File Type Validation': {
        priority: 'HIGH',
        action: 'Strengthen file upload validation',
        implementation: 'Add magic number validation and content inspection'
      },
      'Horizontal Privilege Escalation': {
        priority: 'CRITICAL',
        action: 'Implement resource-level authorization',
        implementation: 'Add ownership checks for all resource modifications'
      }
    };

    return recommendations[test.test] || {
      priority: test.severity.toUpperCase(),
      action: `Address ${test.test} vulnerability`,
      implementation: 'Review test details and implement appropriate fixes'
    };
  }

  extractCriticalIssues() {
    const criticalIssues = [];

    for (const suite of this.results.suites) {
      if (suite.tests) {
        for (const test of suite.tests) {
          if (test.status === 'FAIL' && test.severity === 'critical') {
            criticalIssues.push({
              suite: suite.testSuite,
              test: test.test,
              details: test.details,
              timestamp: test.timestamp
            });
          }
        }
      }
    }

    return criticalIssues;
  }

  calculateSecurityScore() {
    const { totalTests, totalPassed, totalCritical } = this.results.summary;

    if (totalTests === 0) return 0;

    let baseScore = (totalPassed / totalTests) * 100;

    // Penalty for critical issues
    const criticalPenalty = totalCritical * 20;
    const finalScore = Math.max(0, baseScore - criticalPenalty);

    return Math.round(finalScore);
  }

  async generateHtmlReport(reportData) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sesimiz Ol Security Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .risk-critical { color: #d32f2f; font-weight: bold; }
        .risk-high { color: #f57c00; font-weight: bold; }
        .risk-medium { color: #fbc02d; font-weight: bold; }
        .risk-low { color: #388e3c; font-weight: bold; }
        .risk-minimal { color: #4caf50; font-weight: bold; }
        .summary-card { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .test-pass { color: #4caf50; }
        .test-fail { color: #d32f2f; }
        .critical-issue { background: #ffebee; border-left: 4px solid #d32f2f; padding: 10px; margin: 10px 0; }
        .recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 10px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .score { font-size: 48px; font-weight: bold; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Sesimiz Ol Security Test Report</h1>
        <p><strong>Generated:</strong> ${reportData.timestamp}</p>
        <p><strong>Environment:</strong> ${reportData.environment.apiBase}</p>
        <p><strong>Overall Risk Level:</strong> <span class="risk-${reportData.summary.overallRiskLevel.toLowerCase()}">${reportData.summary.overallRiskLevel}</span></p>
    </div>

    <div class="summary-card">
        <h2>Security Score</h2>
        <div class="score ${reportData.securityScore < 70 ? 'risk-critical' : reportData.securityScore < 85 ? 'risk-medium' : 'risk-low'}">
            ${reportData.securityScore}/100
        </div>
    </div>

    <div class="summary-card">
        <h2>Test Summary</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Count</th>
            </tr>
            <tr>
                <td>Total Test Suites</td>
                <td>${reportData.summary.totalSuites}</td>
            </tr>
            <tr>
                <td>Total Tests</td>
                <td>${reportData.summary.totalTests}</td>
            </tr>
            <tr>
                <td class="test-pass">Passed</td>
                <td>${reportData.summary.totalPassed}</td>
            </tr>
            <tr>
                <td class="test-fail">Failed</td>
                <td>${reportData.summary.totalFailed}</td>
            </tr>
            <tr>
                <td class="risk-critical">Critical Issues</td>
                <td>${reportData.summary.totalCritical}</td>
            </tr>
        </table>
    </div>

    ${reportData.criticalIssues.length > 0 ? `
    <div class="summary-card">
        <h2>🚨 Critical Issues Requiring Immediate Attention</h2>
        ${reportData.criticalIssues.map(issue => `
        <div class="critical-issue">
            <h4>${issue.test}</h4>
            <p><strong>Suite:</strong> ${issue.suite}</p>
            <p><strong>Details:</strong> ${issue.details}</p>
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="summary-card">
        <h2>📋 Priority Recommendations</h2>
        ${reportData.recommendations.slice(0, 10).map(rec => `
        <div class="recommendation">
            <h4>${rec.action} (${rec.priority})</h4>
            <p>${rec.implementation}</p>
        </div>
        `).join('')}
    </div>

    <div class="summary-card">
        <h2>📊 Detailed Test Results</h2>
        ${reportData.suites.map(suite => `
        <h3>${suite.testSuite}</h3>
        <p>Tests: ${suite.summary?.total || 0} | Passed: ${suite.summary?.passed || 0} | Failed: ${suite.summary?.failed || 0}</p>
        ${suite.tests ? `
        <table>
            <tr>
                <th>Test</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Details</th>
            </tr>
            ${suite.tests.map(test => `
            <tr>
                <td>${test.test}</td>
                <td class="${test.status === 'PASS' ? 'test-pass' : 'test-fail'}">${test.status}</td>
                <td class="risk-${test.severity}">${test.severity.toUpperCase()}</td>
                <td>${test.details}</td>
            </tr>
            `).join('')}
        </table>
        ` : ''}
        `).join('')}
    </div>

    <div class="summary-card">
        <h2>🛡️ Security Compliance Status</h2>
        <p>This report should be reviewed against:</p>
        <ul>
            <li>OWASP Top 10 vulnerabilities</li>
            <li>Company security policies</li>
            <li>Industry compliance requirements</li>
            <li>Data protection regulations</li>
        </ul>
    </div>
</body>
</html>`;

    const htmlFilename = `./security-test-report-${new Date().toISOString().split('T')[0]}.html`;
    await fs.writeFile(htmlFilename, htmlContent);
    this.log(`HTML report saved to ${htmlFilename}`);
  }

  printFinalSummary() {
    console.log('\\n' + '='.repeat(60));
    console.log('🔒 SECURITY TEST SUITE COMPLETE');
    console.log('='.repeat(60));

    console.log(`\\n📊 OVERALL RESULTS:`);
    console.log(`   Test Suites: ${this.results.summary.totalSuites}`);
    console.log(`   Total Tests: ${this.results.summary.totalTests}`);
    console.log(`   Passed: ${this.results.summary.totalPassed}`);
    console.log(`   Failed: ${this.results.summary.totalFailed}`);
    console.log(`   Critical Issues: ${this.results.summary.totalCritical}`);

    const riskColors = {
      'CRITICAL': '🚨',
      'HIGH': '⚠️',
      'MEDIUM': '🔶',
      'LOW': '🟡',
      'MINIMAL': '✅'
    };

    console.log(`\\n🎯 OVERALL RISK LEVEL: ${riskColors[this.results.summary.overallRiskLevel]} ${this.results.summary.overallRiskLevel}`);
    console.log(`🏆 SECURITY SCORE: ${this.calculateSecurityScore()}/100`);

    if (this.results.summary.totalCritical > 0) {
      console.log('\\n🚨 CRITICAL SECURITY ISSUES FOUND');
      console.log('   ⚡ IMMEDIATE ACTION REQUIRED');
      console.log('   📋 Review detailed report for specific issues');
    } else if (this.results.summary.totalFailed > 0) {
      console.log('\\n⚠️ Security issues found - review and address');
    } else {
      console.log('\\n✅ All security tests passed!');
    }

    console.log(`\\n📄 Reports generated:`);
    console.log(`   📊 JSON: security-test-report-${new Date().toISOString().split('T')[0]}.json`);
    console.log(`   🌐 HTML: security-test-report-${new Date().toISOString().split('T')[0]}.html`);

    console.log('\\n' + '='.repeat(60));
  }
}

// Check if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SecurityTestRunner();
  runner.runAllTests().catch(console.error);
}

export default SecurityTestRunner;