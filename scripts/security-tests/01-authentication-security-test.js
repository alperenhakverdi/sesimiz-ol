#!/usr/bin/env node

/**
 * Authentication Security Testing Suite
 * Tests for authentication vulnerabilities and security controls
 */

import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
const OUTPUT_FILE = './security-test-results.json';

class AuthenticationSecurityTester {
  constructor() {
    this.results = {
      testSuite: 'Authentication Security',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
  }

  log(message) {
    console.log(`[AUTH-SEC] ${message}`);
  }

  addResult(test, status, details, severity = 'medium') {
    const result = {
      test,
      status,
      details,
      severity,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    this.results.summary.total++;

    if (status === 'PASS') {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      if (severity === 'critical') {
        this.results.summary.critical++;
      }
    }

    this.log(`${status}: ${test} [${severity.toUpperCase()}]`);
  }

  async testWeakPasswordAttempts() {
    this.log('Testing weak password rejection...');

    const weakPasswords = [
      '123456',
      'password',
      'admin',
      'qwerty',
      '12345678',
      'abc123',
      'password123'
    ];

    let weakPasswordsAccepted = 0;

    for (const password of weakPasswords) {
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
          nickname: `testuser_${Date.now()}_${Math.random()}`,
          password: password
        });

        if (response.status === 201) {
          weakPasswordsAccepted++;
        }
      } catch (error) {
        // Expected - weak password should be rejected
      }
    }

    if (weakPasswordsAccepted === 0) {
      this.addResult(
        'Weak Password Rejection',
        'PASS',
        'All weak passwords were properly rejected',
        'medium'
      );
    } else {
      this.addResult(
        'Weak Password Rejection',
        'FAIL',
        `${weakPasswordsAccepted} weak passwords were accepted`,
        'high'
      );
    }
  }

  async testBruteForceProtection() {
    this.log('Testing brute force protection...');

    // Create a test user first
    const testNickname = `brutetest_${Date.now()}`;
    const testPassword = 'ValidPassword123!';

    try {
      await axios.post(`${API_BASE}/auth/register`, {
        nickname: testNickname,
        password: testPassword
      });
    } catch (error) {
      // User might already exist or registration failed
    }

    // Attempt multiple failed logins
    let blockedAfterAttempts = 0;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          identifier: testNickname,
          password: 'WrongPassword123!'
        });
      } catch (error) {
        if (error.response?.status === 423) { // Account locked
          blockedAfterAttempts = i + 1;
          break;
        }
      }
    }

    if (blockedAfterAttempts > 0 && blockedAfterAttempts <= 5) {
      this.addResult(
        'Brute Force Protection',
        'PASS',
        `Account locked after ${blockedAfterAttempts} failed attempts`,
        'high'
      );
    } else if (blockedAfterAttempts === 0) {
      this.addResult(
        'Brute Force Protection',
        'FAIL',
        'No account lockout detected after multiple failed attempts',
        'critical'
      );
    } else {
      this.addResult(
        'Brute Force Protection',
        'FAIL',
        `Account locked after ${blockedAfterAttempts} attempts (too many)`,
        'medium'
      );
    }
  }

  async testJWTTokenSecurity() {
    this.log('Testing JWT token security...');

    // Register a test user
    const testUser = {
      nickname: `jwttest_${Date.now()}`,
      password: 'ValidPassword123!'
    };

    let accessToken = null;

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      accessToken = registerResponse.data.data.tokens.accessToken;
    } catch (error) {
      this.addResult(
        'JWT Token Security',
        'FAIL',
        'Could not create test user for JWT testing',
        'medium'
      );
      return;
    }

    // Test 1: Check if token contains sensitive information
    if (accessToken) {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());

          const hasSensitiveData = payload.password || payload.email || payload.secret;

          if (hasSensitiveData) {
            this.addResult(
              'JWT Payload Security',
              'FAIL',
              'JWT token contains sensitive information',
              'high'
            );
          } else {
            this.addResult(
              'JWT Payload Security',
              'PASS',
              'JWT token does not contain sensitive information',
              'medium'
            );
          }
        } catch (error) {
          this.addResult(
            'JWT Payload Security',
            'FAIL',
            'Could not decode JWT payload',
            'medium'
          );
        }
      }
    }

    // Test 2: Try to access protected endpoint with malformed token
    try {
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': 'Bearer invalid.token.here'
        }
      });

      this.addResult(
        'JWT Token Validation',
        'FAIL',
        'Invalid JWT token was accepted',
        'critical'
      );
    } catch (error) {
      if (error.response?.status === 401) {
        this.addResult(
          'JWT Token Validation',
          'PASS',
          'Invalid JWT token was properly rejected',
          'high'
        );
      }
    }
  }

  async testSessionSecurity() {
    this.log('Testing session security...');

    // Test session timeout
    const testUser = {
      nickname: `sessiontest_${Date.now()}`,
      password: 'ValidPassword123!'
    };

    let accessToken = null;

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      accessToken = registerResponse.data.data.tokens.accessToken;

      // Test accessing protected endpoint with valid token
      const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (profileResponse.status === 200) {
        this.addResult(
          'Session Token Functionality',
          'PASS',
          'Valid session token works correctly',
          'medium'
        );
      }
    } catch (error) {
      this.addResult(
        'Session Token Functionality',
        'FAIL',
        'Valid session token was rejected',
        'high'
      );
    }
  }

  async testPasswordComplexity() {
    this.log('Testing password complexity requirements...');

    const testCases = [
      { password: 'Short1!', shouldFail: true, reason: 'too short' },
      { password: 'nouppercase123!', shouldFail: true, reason: 'no uppercase' },
      { password: 'NOLOWERCASE123!', shouldFail: true, reason: 'no lowercase' },
      { password: 'NoNumbers!', shouldFail: true, reason: 'no numbers' },
      { password: 'NoSpecialChars123', shouldFail: true, reason: 'no special chars' },
      { password: 'ValidPassword123!', shouldFail: false, reason: 'valid password' }
    ];

    let passedTests = 0;

    for (const testCase of testCases) {
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
          nickname: `pwtest_${Date.now()}_${Math.random()}`,
          password: testCase.password
        });

        if (testCase.shouldFail) {
          this.log(`FAIL: Password "${testCase.password}" should have been rejected (${testCase.reason})`);
        } else {
          passedTests++;
        }
      } catch (error) {
        if (testCase.shouldFail) {
          passedTests++;
        } else {
          this.log(`FAIL: Valid password "${testCase.password}" was rejected`);
        }
      }
    }

    if (passedTests === testCases.length) {
      this.addResult(
        'Password Complexity Requirements',
        'PASS',
        'All password complexity rules are properly enforced',
        'high'
      );
    } else {
      this.addResult(
        'Password Complexity Requirements',
        'FAIL',
        `${testCases.length - passedTests} password complexity tests failed`,
        'high'
      );
    }
  }

  async testRateLimiting() {
    this.log('Testing authentication rate limiting...');

    const testEndpoint = `${API_BASE}/auth/login`;
    const maxRequests = 20;
    let blockedRequests = 0;

    const requests = [];

    for (let i = 0; i < maxRequests; i++) {
      requests.push(
        axios.post(testEndpoint, {
          identifier: 'nonexistentuser',
          password: 'wrongpassword'
        }).catch(error => {
          if (error.response?.status === 429) {
            blockedRequests++;
          }
          return error.response;
        })
      );
    }

    await Promise.all(requests);

    if (blockedRequests > 0) {
      this.addResult(
        'Authentication Rate Limiting',
        'PASS',
        `${blockedRequests} requests were rate limited`,
        'high'
      );
    } else {
      this.addResult(
        'Authentication Rate Limiting',
        'FAIL',
        'No rate limiting detected on authentication endpoints',
        'high'
      );
    }
  }

  async testCSRFProtection() {
    this.log('Testing CSRF protection...');

    // First, get a valid session
    const testUser = {
      nickname: `csrftest_${Date.now()}`,
      password: 'ValidPassword123!'
    };

    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
      const token = registerResponse.data.data.tokens.accessToken;

      // Try to make a state-changing request without CSRF token
      try {
        const response = await axios.put(`${API_BASE}/auth/profile`, {
          bio: 'Updated bio'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        this.addResult(
          'CSRF Protection',
          'FAIL',
          'State-changing request succeeded without CSRF token',
          'high'
        );
      } catch (error) {
        if (error.response?.status === 403) {
          this.addResult(
            'CSRF Protection',
            'PASS',
            'CSRF protection blocked request without token',
            'high'
          );
        } else {
          this.addResult(
            'CSRF Protection',
            'PARTIAL',
            `Request failed with status ${error.response?.status}, not specifically CSRF`,
            'medium'
          );
        }
      }
    } catch (error) {
      this.addResult(
        'CSRF Protection',
        'FAIL',
        'Could not create test user for CSRF testing',
        'medium'
      );
    }
  }

  async runAllTests() {
    this.log('Starting Authentication Security Test Suite...');

    try {
      await this.testWeakPasswordAttempts();
      await this.testBruteForceProtection();
      await this.testJWTTokenSecurity();
      await this.testSessionSecurity();
      await this.testPasswordComplexity();
      await this.testRateLimiting();
      await this.testCSRFProtection();
    } catch (error) {
      this.log(`Error during testing: ${error.message}`);
    }

    // Save results
    await this.saveResults();
    this.printSummary();
  }

  async saveResults() {
    try {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to ${OUTPUT_FILE}`);
    } catch (error) {
      this.log(`Failed to save results: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n=== AUTHENTICATION SECURITY TEST SUMMARY ===');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Critical Issues: ${this.results.summary.critical}`);

    if (this.results.summary.critical > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND - IMMEDIATE ACTION REQUIRED');
    } else if (this.results.summary.failed > 0) {
      console.log('\n⚠️ Security issues found - review and address');
    } else {
      console.log('\n✅ All authentication security tests passed');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthenticationSecurityTester();
  tester.runAllTests().catch(console.error);
}

export default AuthenticationSecurityTester;