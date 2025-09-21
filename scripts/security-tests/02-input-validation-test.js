#!/usr/bin/env node

/**
 * Input Validation Security Testing Suite
 * Tests for XSS, SQL injection, and input validation vulnerabilities
 */

import axios from 'axios';
import fs from 'fs/promises';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

class InputValidationTester {
  constructor() {
    this.results = {
      testSuite: 'Input Validation Security',
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: 0
      }
    };
    this.testUser = null;
    this.authToken = null;
  }

  log(message) {
    console.log(`[INPUT-VAL] ${message}`);
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

  async setupTestUser() {
    this.log('Setting up test user...');

    const testUser = {
      nickname: `inputtest_${Date.now()}`,
      password: 'ValidPassword123!'
    };

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, testUser);
      this.testUser = testUser;
      this.authToken = response.data.data.tokens.accessToken;
      return true;
    } catch (error) {
      this.log(`Failed to create test user: ${error.message}`);
      return false;
    }
  }

  async testXSSProtection() {
    this.log('Testing XSS protection...');

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '<iframe src="javascript:alert(`XSS`)">',
      '\'"--></style></script><script>alert("XSS")</script>',
      '<marquee><img src=x onerror=confirm("XSS")></marquee>',
      '<details open ontoggle=alert("XSS")>',
      '<body onload=alert("XSS")>'
    ];

    let vulnerableFields = [];

    // Test XSS in story creation
    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${API_BASE}/stories`, {
          title: `Test Story ${Date.now()}`,
          content: payload,
          categoryId: 1
        }, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 201) {
          // Check if the payload was sanitized
          const storyContent = response.data.story?.content || '';
          if (storyContent.includes('<script>') || storyContent.includes('onerror') ||
              storyContent.includes('onload') || storyContent.includes('javascript:')) {
            vulnerableFields.push('story.content');
          }
        }
      } catch (error) {
        // Request might be rejected due to validation
      }
    }

    // Test XSS in profile update
    for (const payload of xssPayloads) {
      try {
        const response = await axios.put(`${API_BASE}/auth/profile`, {
          bio: payload
        }, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          const bio = response.data.user?.bio || '';
          if (bio.includes('<script>') || bio.includes('onerror') ||
              bio.includes('onload') || bio.includes('javascript:')) {
            vulnerableFields.push('user.bio');
          }
        }
      } catch (error) {
        // Request might be rejected
      }
    }

    if (vulnerableFields.length === 0) {
      this.addResult(
        'XSS Protection',
        'PASS',
        'No XSS vulnerabilities detected in input fields',
        'high'
      );
    } else {
      this.addResult(
        'XSS Protection',
        'FAIL',
        `XSS vulnerabilities found in: ${vulnerableFields.join(', ')}`,
        'critical'
      );
    }
  }

  async testSQLInjectionProtection() {
    this.log('Testing SQL injection protection...');

    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT password FROM users --",
      "1'; INSERT INTO users (nickname, password) VALUES ('hacker', 'pwd'); --",
      "' OR 1=1; --",
      "admin'--",
      "admin' #",
      "admin'/*",
      "' OR '1'='1' /*",
      "' OR '1'='1' #"
    ];

    let vulnerableEndpoints = [];

    // Test login endpoint
    for (const payload of sqlPayloads) {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          identifier: payload,
          password: 'test'
        });

        if (response.status === 200) {
          vulnerableEndpoints.push('auth/login');
          break;
        }
      } catch (error) {
        // Expected - should be rejected
      }
    }

    // Test story search
    for (const payload of sqlPayloads) {
      try {
        const response = await axios.get(`${API_BASE}/stories/search`, {
          params: { q: payload }
        });

        // Check for SQL error messages in response
        const responseText = JSON.stringify(response.data);
        if (responseText.includes('SQL') || responseText.includes('syntax error') ||
            responseText.includes('ORA-') || responseText.includes('MySQL')) {
          vulnerableEndpoints.push('stories/search');
          break;
        }
      } catch (error) {
        const errorText = error.response?.data ? JSON.stringify(error.response.data) : '';
        if (errorText.includes('SQL') || errorText.includes('syntax error')) {
          vulnerableEndpoints.push('stories/search');
          break;
        }
      }
    }

    if (vulnerableEndpoints.length === 0) {
      this.addResult(
        'SQL Injection Protection',
        'PASS',
        'No SQL injection vulnerabilities detected',
        'critical'
      );
    } else {
      this.addResult(
        'SQL Injection Protection',
        'FAIL',
        `SQL injection vulnerabilities found in: ${vulnerableEndpoints.join(', ')}`,
        'critical'
      );
    }
  }

  async testInputSanitization() {
    this.log('Testing input sanitization...');

    const maliciousInputs = [
      { field: 'nickname', value: '../../../etc/passwd', endpoint: 'auth/register' },
      { field: 'email', value: 'test@example.com<script>alert(1)</script>', endpoint: 'auth/register' },
      { field: 'title', value: '\x00\x01\x02\x03\x04\x05', endpoint: 'stories' },
      { field: 'content', value: 'A'.repeat(100000), endpoint: 'stories' }, // Length attack
      { field: 'bio', value: '../../config/database.yml', endpoint: 'auth/profile' }
    ];

    let sanitizationIssues = [];

    for (const input of maliciousInputs) {
      try {
        let response;

        if (input.endpoint === 'auth/register') {
          response = await axios.post(`${API_BASE}/auth/register`, {
            nickname: input.field === 'nickname' ? input.value : `test_${Date.now()}`,
            email: input.field === 'email' ? input.value : null,
            password: 'ValidPassword123!'
          });
        } else if (input.endpoint === 'stories') {
          response = await axios.post(`${API_BASE}/stories`, {
            title: input.field === 'title' ? input.value : 'Test Title',
            content: input.field === 'content' ? input.value : 'Test content',
            categoryId: 1
          }, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          });
        } else if (input.endpoint === 'auth/profile') {
          response = await axios.put(`${API_BASE}/auth/profile`, {
            bio: input.field === 'bio' ? input.value : 'Test bio'
          }, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          });
        }

        // Check if malicious input was properly sanitized
        const responseData = JSON.stringify(response.data);
        if (responseData.includes('../') || responseData.includes('etc/passwd') ||
            responseData.includes('<script>') || responseData.includes('\x00')) {
          sanitizationIssues.push(`${input.endpoint}:${input.field}`);
        }
      } catch (error) {
        // Input might be rejected, which is good
        if (error.response?.status === 500) {
          // Server error might indicate improper handling
          sanitizationIssues.push(`${input.endpoint}:${input.field} (server error)`);
        }
      }
    }

    if (sanitizationIssues.length === 0) {
      this.addResult(
        'Input Sanitization',
        'PASS',
        'Input sanitization appears to be working correctly',
        'medium'
      );
    } else {
      this.addResult(
        'Input Sanitization',
        'FAIL',
        `Sanitization issues found: ${sanitizationIssues.join(', ')}`,
        'high'
      );
    }
  }

  async testFilenameInjection() {
    this.log('Testing filename injection...');

    const maliciousFilenames = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      'file.php%00.jpg',
      'test.asp;.jpg',
      'shell.php',
      'test\x00.jpg'
    ];

    // Note: This test would require actual file upload capability
    // For now, we'll test if the API properly validates file extensions

    let filenameIssues = [];

    // Test if we can upload files with suspicious names (if upload endpoint exists)
    for (const filename of maliciousFilenames) {
      try {
        // Create a simple test file buffer
        const fileContent = Buffer.from('test image content');

        const formData = new FormData();
        formData.append('avatar', new Blob([fileContent]), filename);

        const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200) {
          filenameIssues.push(filename);
        }
      } catch (error) {
        // Expected - malicious filenames should be rejected
      }
    }

    if (filenameIssues.length === 0) {
      this.addResult(
        'Filename Injection Protection',
        'PASS',
        'Malicious filenames were properly rejected',
        'medium'
      );
    } else {
      this.addResult(
        'Filename Injection Protection',
        'FAIL',
        `Malicious filenames accepted: ${filenameIssues.join(', ')}`,
        'high'
      );
    }
  }

  async testContentLengthValidation() {
    this.log('Testing content length validation...');

    const lengthTests = [
      { field: 'nickname', maxLength: 20, testLength: 1000 },
      { field: 'bio', maxLength: 280, testLength: 5000 },
      { field: 'title', maxLength: 200, testLength: 1000 },
      { field: 'content', maxLength: 50000, testLength: 100000 }
    ];

    let lengthValidationIssues = [];

    for (const test of lengthTests) {
      const longValue = 'A'.repeat(test.testLength);

      try {
        let response;

        if (test.field === 'nickname') {
          response = await axios.post(`${API_BASE}/auth/register`, {
            nickname: longValue,
            password: 'ValidPassword123!'
          });
        } else if (test.field === 'bio') {
          response = await axios.put(`${API_BASE}/auth/profile`, {
            bio: longValue
          }, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          });
        } else if (test.field === 'title' || test.field === 'content') {
          response = await axios.post(`${API_BASE}/stories`, {
            title: test.field === 'title' ? longValue : 'Test Title',
            content: test.field === 'content' ? longValue : 'Test content',
            categoryId: 1
          }, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`
            }
          });
        }

        // If request succeeded, length validation might be missing
        if (response.status === 200 || response.status === 201) {
          lengthValidationIssues.push(`${test.field} (${test.testLength} chars)`);
        }
      } catch (error) {
        // Expected - overly long input should be rejected
      }
    }

    if (lengthValidationIssues.length === 0) {
      this.addResult(
        'Content Length Validation',
        'PASS',
        'Content length validation is working correctly',
        'medium'
      );
    } else {
      this.addResult(
        'Content Length Validation',
        'FAIL',
        `Length validation missing for: ${lengthValidationIssues.join(', ')}`,
        'medium'
      );
    }
  }

  async testSpecialCharacterHandling() {
    this.log('Testing special character handling...');

    const specialChars = [
      '\u0000', // Null byte
      '\uFEFF', // BOM
      '\u200E', // Left-to-right mark
      '\u200F', // Right-to-left mark
      '\u2028', // Line separator
      '\u2029', // Paragraph separator
      '\\r\\n\\r\\n', // CRLF injection
      String.fromCharCode(0x7F) // DEL character
    ];

    let charHandlingIssues = [];

    for (const char of specialChars) {
      try {
        const testContent = `Normal content ${char} with special character`;

        const response = await axios.post(`${API_BASE}/stories`, {
          title: 'Special Char Test',
          content: testContent,
          categoryId: 1
        }, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        if (response.status === 201) {
          // Check if special character was properly handled
          const returnedContent = response.data.story?.content || '';
          if (returnedContent.includes(char)) {
            charHandlingIssues.push(`Character code: ${char.charCodeAt(0)}`);
          }
        }
      } catch (error) {
        // Request rejection might be appropriate for some special chars
      }
    }

    if (charHandlingIssues.length === 0) {
      this.addResult(
        'Special Character Handling',
        'PASS',
        'Special characters are properly handled',
        'low'
      );
    } else {
      this.addResult(
        'Special Character Handling',
        'FAIL',
        `Unhandled special characters: ${charHandlingIssues.join(', ')}`,
        'medium'
      );
    }
  }

  async runAllTests() {
    this.log('Starting Input Validation Security Test Suite...');

    const userSetup = await this.setupTestUser();
    if (!userSetup) {
      this.log('Failed to setup test user. Aborting tests.');
      return;
    }

    try {
      await this.testXSSProtection();
      await this.testSQLInjectionProtection();
      await this.testInputSanitization();
      await this.testFilenameInjection();
      await this.testContentLengthValidation();
      await this.testSpecialCharacterHandling();
    } catch (error) {
      this.log(`Error during testing: ${error.message}`);
    }

    await this.saveResults();
    this.printSummary();
  }

  async saveResults() {
    try {
      const filename = './input-validation-test-results.json';
      await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to ${filename}`);
    } catch (error) {
      this.log(`Failed to save results: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\n=== INPUT VALIDATION SECURITY TEST SUMMARY ===');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Critical Issues: ${this.results.summary.critical}`);

    if (this.results.summary.critical > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND - IMMEDIATE ACTION REQUIRED');
    } else if (this.results.summary.failed > 0) {
      console.log('\n⚠️ Security issues found - review and address');
    } else {
      console.log('\n✅ All input validation security tests passed');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new InputValidationTester();
  tester.runAllTests().catch(console.error);
}

export default InputValidationTester;