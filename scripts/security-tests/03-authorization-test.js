#!/usr/bin/env node

/**
 * Authorization Security Testing Suite
 * Tests for authorization bypass, privilege escalation, and access control vulnerabilities
 */

import axios from 'axios';
import fs from 'fs/promises';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

class AuthorizationTester {
  constructor() {
    this.results = {
      testSuite: 'Authorization Security',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    this.users = {
      user1: null,
      user2: null,
      admin: null
    };
    this.tokens = {
      user1: null,
      user2: null,
      admin: null
    };
  }

  log(message) {
    console.log(`[AUTHZ] ${message}`);
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

  async setupTestUsers() {
    this.log('Setting up test users...');

    const users = [
      { name: 'user1', nickname: `authztest1_${Date.now()}`, password: 'ValidPassword123!' },
      { name: 'user2', nickname: `authztest2_${Date.now()}`, password: 'ValidPassword123!' },
      { name: 'admin', nickname: `authzadmin_${Date.now()}`, password: 'ValidPassword123!' }
    ];

    for (const user of users) {
      try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
          nickname: user.nickname,
          password: user.password
        });

        this.users[user.name] = {
          id: response.data.data.user.id,
          nickname: user.nickname,
          password: user.password
        };
        this.tokens[user.name] = response.data.data.tokens.accessToken;

        this.log(`Created test user: ${user.name}`);
      } catch (error) {
        this.log(`Failed to create user ${user.name}: ${error.message}`);
        return false;
      }
    }

    return true;
  }

  async testHorizontalPrivilegeEscalation() {
    this.log('Testing horizontal privilege escalation...');

    // User1 creates a story
    let story1Id = null;
    try {
      const response = await axios.post(`${API_BASE}/stories`, {
        title: 'User1 Private Story',
        content: 'This is user1\'s private content',
        categoryId: 1
      }, {
        headers: {
          'Authorization': `Bearer ${this.tokens.user1}`
        }
      });

      story1Id = response.data.story.id;
    } catch (error) {
      this.addResult(
        'Horizontal Privilege Escalation Setup',
        'FAIL',
        'Could not create test story',
        'medium'
      );
      return;
    }

    // User2 tries to modify user1's story
    try {
      const response = await axios.put(`${API_BASE}/stories/${story1Id}`, {
        title: 'Modified by User2',
        content: 'User2 modified this content'
      }, {
        headers: {
          'Authorization': `Bearer ${this.tokens.user2}`
        }
      });

      if (response.status === 200) {
        this.addResult(
          'Horizontal Privilege Escalation - Story Modification',
          'FAIL',
          'User2 was able to modify User1\'s story',
          'critical'
        );
      }
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        this.addResult(
          'Horizontal Privilege Escalation - Story Modification',
          'PASS',
          'User2 was properly denied access to modify User1\'s story',
          'high'
        );
      } else {
        this.addResult(
          'Horizontal Privilege Escalation - Story Modification',
          'PARTIAL',
          `Request failed with status ${error.response?.status}`,
          'medium'
        );
      }
    }

    // User2 tries to delete user1's story
    try {
      const response = await axios.delete(`${API_BASE}/stories/${story1Id}`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.user2}`
        }
      });

      if (response.status === 200) {
        this.addResult(
          'Horizontal Privilege Escalation - Story Deletion',
          'FAIL',
          'User2 was able to delete User1\'s story',
          'critical'
        );
      }
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 404) {
        this.addResult(
          'Horizontal Privilege Escalation - Story Deletion',
          'PASS',
          'User2 was properly denied access to delete User1\'s story',
          'high'
        );
      }
    }
  }

  async testVerticalPrivilegeEscalation() {
    this.log('Testing vertical privilege escalation...');

    // Test if regular user can access admin endpoints
    const adminEndpoints = [
      '/admin/users',
      '/admin/stats',
      '/admin/reports',
      '/admin/announcements'
    ];

    let accessibleEndpoints = [];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.tokens.user1}`
          }
        });

        if (response.status === 200) {
          accessibleEndpoints.push(endpoint);
        }
      } catch (error) {
        // Expected - regular users should not access admin endpoints
      }
    }

    if (accessibleEndpoints.length === 0) {
      this.addResult(
        'Vertical Privilege Escalation - Admin Endpoints',
        'PASS',
        'Regular user cannot access admin endpoints',
        'critical'
      );
    } else {
      this.addResult(
        'Vertical Privilege Escalation - Admin Endpoints',
        'FAIL',
        `Regular user can access admin endpoints: ${accessibleEndpoints.join(', ')}`,
        'critical'
      );
    }
  }

  async testDirectObjectReference() {
    this.log('Testing insecure direct object reference...');

    // Test accessing user profiles
    const userId1 = this.users.user1.id;
    const userId2 = this.users.user2.id;

    // User2 tries to access User1's private profile data
    try {
      const response = await axios.get(`${API_BASE}/users/${userId1}`, {
        headers: {
          'Authorization': `Bearer ${this.tokens.user2}`
        }
      });

      if (response.status === 200) {
        const userData = response.data;

        // Check if sensitive information is exposed
        if (userData.email || userData.password || userData.lastLoginAt) {
          this.addResult(
            'Insecure Direct Object Reference - User Profile',
            'FAIL',
            'Sensitive user information exposed via direct object reference',
            'high'
          );
        } else {
          this.addResult(
            'Insecure Direct Object Reference - User Profile',
            'PASS',
            'User profile access properly restricted',
            'medium'
          );
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        this.addResult(
          'Insecure Direct Object Reference - User Profile',
          'PASS',
          'User profile access properly restricted',
          'medium'
        );
      }
    }
  }

  async testSessionManagement() {
    this.log('Testing session management security...');

    // Test if expired tokens are properly rejected
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    try {
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });

      if (response.status === 200) {
        this.addResult(
          'Session Management - Expired Token',
          'FAIL',
          'Expired/invalid token was accepted',
          'critical'
        );
      }
    } catch (error) {
      if (error.response?.status === 401) {
        this.addResult(
          'Session Management - Expired Token',
          'PASS',
          'Expired/invalid token was properly rejected',
          'high'
        );
      }
    }

    // Test if malformed tokens are rejected
    const malformedTokens = [
      'invalid.token.here',
      'Bearer malformed',
      'not-a-jwt-token',
      ''
    ];

    let malformedAccepted = 0;

    for (const token of malformedTokens) {
      try {
        const response = await axios.get(`${API_BASE}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          malformedAccepted++;
        }
      } catch (error) {
        // Expected - malformed tokens should be rejected
      }
    }

    if (malformedAccepted === 0) {
      this.addResult(
        'Session Management - Malformed Tokens',
        'PASS',
        'All malformed tokens were properly rejected',
        'high'
      );
    } else {
      this.addResult(
        'Session Management - Malformed Tokens',
        'FAIL',
        `${malformedAccepted} malformed tokens were accepted`,
        'critical'
      );
    }
  }

  async testAPIEndpointSecurity() {
    this.log('Testing API endpoint security...');

    // Test endpoints that should require authentication
    const protectedEndpoints = [
      { method: 'POST', path: '/stories', description: 'Create story' },
      { method: 'PUT', path: '/auth/profile', description: 'Update profile' },
      { method: 'PUT', path: '/auth/password', description: 'Change password' },
      { method: 'DELETE', path: '/auth/account', description: 'Delete account' }
    ];

    let unprotectedEndpoints = [];

    for (const endpoint of protectedEndpoints) {
      try {
        let response;

        if (endpoint.method === 'POST') {
          response = await axios.post(`${API_BASE}${endpoint.path}`, {
            title: 'Test',
            content: 'Test content'
          });
        } else if (endpoint.method === 'PUT') {
          response = await axios.put(`${API_BASE}${endpoint.path}`, {
            bio: 'Test bio'
          });
        } else if (endpoint.method === 'DELETE') {
          response = await axios.delete(`${API_BASE}${endpoint.path}`);
        }

        if (response.status === 200 || response.status === 201) {
          unprotectedEndpoints.push(`${endpoint.method} ${endpoint.path}`);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          // Expected - endpoints should require authentication
        }
      }
    }

    if (unprotectedEndpoints.length === 0) {
      this.addResult(
        'API Endpoint Security - Authentication Required',
        'PASS',
        'All protected endpoints properly require authentication',
        'high'
      );
    } else {
      this.addResult(
        'API Endpoint Security - Authentication Required',
        'FAIL',
        `Endpoints accessible without authentication: ${unprotectedEndpoints.join(', ')}`,
        'critical'
      );
    }
  }

  async testRoleBasedAccess() {
    this.log('Testing role-based access control...');

    // Test if users can only access their own data
    const testCases = [
      {
        description: 'User accessing own drafts',
        endpoint: `/stories/drafts`,
        token: this.tokens.user1,
        shouldSucceed: true
      },
      {
        description: 'User changing own password',
        endpoint: `/auth/password`,
        method: 'PUT',
        token: this.tokens.user1,
        data: { currentPassword: 'ValidPassword123!', newPassword: 'NewPassword123!' },
        shouldSucceed: true
      }
    ];

    for (const testCase of testCases) {
      try {
        let response;

        if (testCase.method === 'PUT') {
          response = await axios.put(`${API_BASE}${testCase.endpoint}`, testCase.data, {
            headers: {
              'Authorization': `Bearer ${testCase.token}`
            }
          });
        } else {
          response = await axios.get(`${API_BASE}${testCase.endpoint}`, {
            headers: {
              'Authorization': `Bearer ${testCase.token}`
            }
          });
        }

        const success = response.status === 200 || response.status === 201;

        if (success === testCase.shouldSucceed) {
          this.addResult(
            `Role-Based Access - ${testCase.description}`,
            'PASS',
            'Access control working as expected',
            'medium'
          );
        } else {
          this.addResult(
            `Role-Based Access - ${testCase.description}`,
            'FAIL',
            `Expected ${testCase.shouldSucceed ? 'success' : 'failure'}, got ${success ? 'success' : 'failure'}`,
            'high'
          );
        }
      } catch (error) {
        const failed = error.response?.status >= 400;

        if (failed !== testCase.shouldSucceed) {
          this.addResult(
            `Role-Based Access - ${testCase.description}`,
            'PASS',
            'Access control working as expected',
            'medium'
          );
        } else {
          this.addResult(
            `Role-Based Access - ${testCase.description}`,
            'FAIL',
            `Unexpected access control behavior: ${error.response?.status}`,
            'high'
          );
        }
      }
    }
  }

  async testParameterPollution() {
    this.log('Testing parameter pollution vulnerabilities...');

    // Test HTTP Parameter Pollution
    const pollutionTests = [
      {
        endpoint: '/stories/search',
        params: 'q=test&q=admin&q=password',
        description: 'Search parameter pollution'
      },
      {
        endpoint: '/auth/login',
        method: 'POST',
        data: 'identifier=user1&identifier=admin&password=test&password=admin',
        description: 'Login parameter pollution'
      }
    ];

    let pollutionVulnerabilities = [];

    for (const test of pollutionTests) {
      try {
        let response;

        if (test.method === 'POST') {
          response = await axios.post(`${API_BASE}${test.endpoint}`, test.data, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
        } else {
          response = await axios.get(`${API_BASE}${test.endpoint}?${test.params}`);
        }

        // Check response for unexpected behavior
        const responseText = JSON.stringify(response.data);
        if (responseText.includes('admin') || responseText.includes('error')) {
          pollutionVulnerabilities.push(test.description);
        }
      } catch (error) {
        // Check error response for information leakage
        const errorText = error.response?.data ? JSON.stringify(error.response.data) : '';
        if (errorText.includes('duplicate') || errorText.includes('ambiguous')) {
          pollutionVulnerabilities.push(test.description);
        }
      }
    }

    if (pollutionVulnerabilities.length === 0) {
      this.addResult(
        'Parameter Pollution Protection',
        'PASS',
        'No parameter pollution vulnerabilities detected',
        'medium'
      );
    } else {
      this.addResult(
        'Parameter Pollution Protection',
        'FAIL',
        `Parameter pollution vulnerabilities: ${pollutionVulnerabilities.join(', ')}`,
        'medium'
      );
    }
  }

  async runAllTests() {
    this.log('Starting Authorization Security Test Suite...');

    const userSetup = await this.setupTestUsers();
    if (!userSetup) {
      this.log('Failed to setup test users. Aborting tests.');
      return;
    }

    try {
      await this.testHorizontalPrivilegeEscalation();
      await this.testVerticalPrivilegeEscalation();
      await this.testDirectObjectReference();
      await this.testSessionManagement();
      await this.testAPIEndpointSecurity();
      await this.testRoleBasedAccess();
      await this.testParameterPollution();
    } catch (error) {
      this.log(`Error during testing: ${error.message}`);
    }

    await this.saveResults();
    this.printSummary();
  }

  async saveResults() {
    try {
      const filename = './authorization-test-results.json';
      await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to ${filename}`);
    } catch (error) {
      this.log(`Failed to save results: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n=== AUTHORIZATION SECURITY TEST SUMMARY ===');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Critical Issues: ${this.results.summary.critical}`);

    if (this.results.summary.critical > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND - IMMEDIATE ACTION REQUIRED');
    } else if (this.results.summary.failed > 0) {
      console.log('\n⚠️ Security issues found - review and address');
    } else {
      console.log('\n✅ All authorization security tests passed');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuthorizationTester();
  tester.runAllTests().catch(console.error);
}

export default AuthorizationTester;