#!/usr/bin/env node

/**
 * File Upload Security Testing Suite
 * Tests for file upload vulnerabilities and security controls
 */

import axios from 'axios';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import path from 'path';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

class FileUploadSecurityTester {
  constructor() {
    this.results = {
      testSuite: 'File Upload Security',
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
    this.testFilesDir = './test-files';
  }

  log(message) {
    console.log(`[FILE-UPLOAD] ${message}`);
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
      nickname: `uploadtest_${Date.now()}`,
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

  async createTestFiles() {
    this.log('Creating test files...');

    try {
      await fs.mkdir(this.testFilesDir, { recursive: true });

      // Create legitimate image file
      const validImageContent = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
      ]);
      await fs.writeFile(path.join(this.testFilesDir, 'valid.jpg'), validImageContent);

      // Create PHP shell file disguised as image
      const phpShellContent = Buffer.concat([
        validImageContent,
        Buffer.from('\\n<?php system($_GET["cmd"]); ?>')
      ]);
      await fs.writeFile(path.join(this.testFilesDir, 'shell.jpg'), phpShellContent);

      // Create executable file
      const executableContent = Buffer.from('#!/bin/bash\\necho "malicious script"');
      await fs.writeFile(path.join(this.testFilesDir, 'malicious.sh'), executableContent);

      // Create oversized file
      const oversizedContent = Buffer.alloc(10 * 1024 * 1024, 'A'); // 10MB
      await fs.writeFile(path.join(this.testFilesDir, 'oversized.jpg'), oversizedContent);

      // Create file with null bytes
      const nullByteContent = Buffer.from('valid content\\x00<?php phpinfo(); ?>');
      await fs.writeFile(path.join(this.testFilesDir, 'nullbyte.jpg'), nullByteContent);

      // Create SVG with script
      const maliciousSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
</svg>`;
      await fs.writeFile(path.join(this.testFilesDir, 'malicious.svg'), maliciousSvg);

      this.log('Test files created successfully');
      return true;
    } catch (error) {
      this.log(`Failed to create test files: ${error.message}`);
      return false;
    }
  }

  async testFileTypeValidation() {
    this.log('Testing file type validation...');

    const maliciousFiles = [
      { filename: 'malicious.sh', mimetype: 'application/x-sh', description: 'Shell script' },
      { filename: 'shell.jpg', mimetype: 'image/jpeg', description: 'PHP shell in JPEG' },
      { filename: 'malicious.svg', mimetype: 'image/svg+xml', description: 'SVG with script' },
      { filename: 'test.php', content: '<?php phpinfo(); ?>', mimetype: 'text/php', description: 'PHP file' },
      { filename: 'test.exe', content: 'MZ\\x90\\x00', mimetype: 'application/octet-stream', description: 'Executable file' }
    ];

    let acceptedMaliciousFiles = [];

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();

        let fileContent;
        if (file.content) {
          fileContent = Buffer.from(file.content);
        } else {
          fileContent = await fs.readFile(path.join(this.testFilesDir, file.filename));
        }

        formData.append('avatar', fileContent, {
          filename: file.filename,
          contentType: file.mimetype
        });

        const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            ...formData.getHeaders()
          }
        });

        if (response.status === 200) {
          acceptedMaliciousFiles.push(file.description);
        }
      } catch (error) {
        // Expected - malicious files should be rejected
      }
    }

    if (acceptedMaliciousFiles.length === 0) {
      this.addResult(
        'File Type Validation',
        'PASS',
        'All malicious file types were properly rejected',
        'high'
      );
    } else {
      this.addResult(
        'File Type Validation',
        'FAIL',
        `Malicious files accepted: ${acceptedMaliciousFiles.join(', ')}`,
        'critical'
      );
    }
  }

  async testFileSizeValidation() {
    this.log('Testing file size validation...');

    try {
      const formData = new FormData();
      const oversizedContent = await fs.readFile(path.join(this.testFilesDir, 'oversized.jpg'));

      formData.append('avatar', oversizedContent, {
        filename: 'oversized.jpg',
        contentType: 'image/jpeg'
      });

      const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          ...formData.getHeaders()
        }
      });

      if (response.status === 200) {
        this.addResult(
          'File Size Validation',
          'FAIL',
          'Oversized file was accepted',
          'medium'
        );
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.data?.error?.code === 'FILE_TOO_LARGE') {
        this.addResult(
          'File Size Validation',
          'PASS',
          'Oversized file was properly rejected',
          'medium'
        );
      } else {
        this.addResult(
          'File Size Validation',
          'PARTIAL',
          `File rejected with status: ${error.response?.status}`,
          'medium'
        );
      }
    }
  }

  async testFileContentValidation() {
    this.log('Testing file content validation...');

    // Test files with malicious content but valid extensions
    const contentTests = [
      {
        filename: 'fake_image.jpg',
        content: '<?php system($_GET["cmd"]); ?>',
        mimetype: 'image/jpeg',
        description: 'PHP code as JPEG'
      },
      {
        filename: 'script.png',
        content: '<script>alert("XSS")</script>',
        mimetype: 'image/png',
        description: 'JavaScript as PNG'
      },
      {
        filename: 'shell.gif',
        content: '#!/bin/bash\\nrm -rf /',
        mimetype: 'image/gif',
        description: 'Shell script as GIF'
      }
    ];

    let acceptedMaliciousContent = [];

    for (const test of contentTests) {
      try {
        const formData = new FormData();
        formData.append('avatar', Buffer.from(test.content), {
          filename: test.filename,
          contentType: test.mimetype
        });

        const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            ...formData.getHeaders()
          }
        });

        if (response.status === 200) {
          acceptedMaliciousContent.push(test.description);
        }
      } catch (error) {
        // Expected - files with malicious content should be rejected
      }
    }

    if (acceptedMaliciousContent.length === 0) {
      this.addResult(
        'File Content Validation',
        'PASS',
        'Files with malicious content were properly rejected',
        'high'
      );
    } else {
      this.addResult(
        'File Content Validation',
        'FAIL',
        `Malicious content accepted: ${acceptedMaliciousContent.join(', ')}`,
        'high'
      );
    }
  }

  async testFilenameInjection() {
    this.log('Testing filename injection vulnerabilities...');

    const maliciousFilenames = [
      '../../../etc/passwd',
      '..\\\\..\\\\..\\\\windows\\\\system32\\\\config\\\\sam',
      'file.php%00.jpg',
      'test.asp;.jpg',
      'shell.php\\x00.jpg',
      '$(whoami).jpg',
      '`id`.png',
      'file|nc -l 4444.jpg',
      'test\\'\\'/etc/passwd',
      'normal.jpg\\n<?php phpinfo(); ?>'
    ];

    let dangerousFilenames = [];

    for (const filename of maliciousFilenames) {
      try {
        const formData = new FormData();
        const validImageContent = await fs.readFile(path.join(this.testFilesDir, 'valid.jpg'));

        formData.append('avatar', validImageContent, {
          filename: filename,
          contentType: 'image/jpeg'
        });

        const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            ...formData.getHeaders()
          }
        });

        if (response.status === 200) {
          dangerousFilenames.push(filename);
        }
      } catch (error) {
        // Expected - malicious filenames should be rejected
      }
    }

    if (dangerousFilenames.length === 0) {
      this.addResult(
        'Filename Injection Protection',
        'PASS',
        'All malicious filenames were properly rejected',
        'high'
      );
    } else {
      this.addResult(
        'Filename Injection Protection',
        'FAIL',
        `Dangerous filenames accepted: ${dangerousFilenames.length} files`,
        'high'
      );
    }
  }

  async testDirectoryTraversal() {
    this.log('Testing directory traversal vulnerabilities...');

    const traversalPaths = [
      '../../../etc/passwd',
      '..\\\\..\\\\..\\\\windows\\\\system32\\\\config\\\\sam',
      '/etc/passwd',
      'C:\\\\windows\\\\system32\\\\config\\\\sam',
      '....//....//....//etc/passwd',
      '..\\\\..\\\\..\\\\etc\\\\passwd'
    ];

    let traversalVulnerabilities = [];

    for (const maliciousPath of traversalPaths) {
      try {
        // Try to access files using path traversal
        const response = await axios.get(`${API_BASE}/uploads/avatars/${maliciousPath}`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        });

        if (response.status === 200) {
          traversalVulnerabilities.push(maliciousPath);
        }
      } catch (error) {
        // Expected - path traversal should be blocked
      }
    }

    if (traversalVulnerabilities.length === 0) {
      this.addResult(
        'Directory Traversal Protection',
        'PASS',
        'Directory traversal attempts were properly blocked',
        'high'
      );
    } else {
      this.addResult(
        'Directory Traversal Protection',
        'FAIL',
        `Directory traversal successful for: ${traversalVulnerabilities.join(', ')}`,
        'critical'
      );
    }
  }

  async testFileExecutionPrevention() {
    this.log('Testing file execution prevention...');

    // Test if uploaded files can be executed by accessing them directly
    try {
      // First, try to upload a PHP file
      const formData = new FormData();
      const phpContent = '<?php echo "File execution test"; ?>';

      formData.append('avatar', Buffer.from(phpContent), {
        filename: 'test.php',
        contentType: 'text/php'
      });

      const uploadResponse = await axios.post(`${API_BASE}/upload/avatar`, formData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          ...formData.getHeaders()
        }
      });

      // If upload succeeded, try to execute the file
      if (uploadResponse.status === 200) {
        const filename = uploadResponse.data.filename || 'test.php';

        try {
          const executeResponse = await axios.get(`${API_BASE}/uploads/avatars/${filename}`);

          if (executeResponse.data.includes('File execution test')) {
            this.addResult(
              'File Execution Prevention',
              'FAIL',
              'Uploaded PHP file was executed',
              'critical'
            );
          } else {
            this.addResult(
              'File Execution Prevention',
              'PASS',
              'Uploaded file was not executed',
              'high'
            );
          }
        } catch (error) {
          this.addResult(
            'File Execution Prevention',
            'PASS',
            'File execution properly prevented',
            'high'
          );
        }
      } else {
        this.addResult(
          'File Execution Prevention',
          'PASS',
          'Executable file types properly rejected',
          'high'
        );
      }
    } catch (error) {
      this.addResult(
        'File Execution Prevention',
        'PASS',
        'Executable file upload properly blocked',
        'high'
      );
    }
  }

  async testMimeTypeValidation() {
    this.log('Testing MIME type validation...');

    // Test MIME type spoofing
    const mimeTests = [
      {
        filename: 'shell.jpg',
        content: '<?php system($_GET["cmd"]); ?>',
        trueMime: 'text/php',
        fakeMime: 'image/jpeg',
        description: 'PHP spoofed as JPEG'
      },
      {
        filename: 'script.png',
        content: '<script>alert("XSS")</script>',
        trueMime: 'text/html',
        fakeMime: 'image/png',
        description: 'HTML spoofed as PNG'
      }
    ];

    let mimeSpoofingSuccessful = [];

    for (const test of mimeTests) {
      try {
        const formData = new FormData();
        formData.append('avatar', Buffer.from(test.content), {
          filename: test.filename,
          contentType: test.fakeMime
        });

        const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            ...formData.getHeaders()
          }
        });

        if (response.status === 200) {
          mimeSpoofingSuccessful.push(test.description);
        }
      } catch (error) {
        // Expected - MIME type spoofing should be detected
      }
    }

    if (mimeSpoofingSuccessful.length === 0) {
      this.addResult(
        'MIME Type Validation',
        'PASS',
        'MIME type spoofing attempts were properly detected',
        'high'
      );
    } else {
      this.addResult(
        'MIME Type Validation',
        'FAIL',
        `MIME spoofing successful: ${mimeSpoofingSuccessful.join(', ')}`,
        'high'
      );
    }
  }

  async testUploadRateLimiting() {
    this.log('Testing upload rate limiting...');

    const maxUploads = 15;
    let successfulUploads = 0;
    let rateLimited = false;

    const validImageContent = await fs.readFile(path.join(this.testFilesDir, 'valid.jpg'));

    for (let i = 0; i < maxUploads; i++) {
      try {
        const formData = new FormData();
        formData.append('avatar', validImageContent, {
          filename: `test_${i}.jpg`,
          contentType: 'image/jpeg'
        });

        const response = await axios.post(`${API_BASE}/upload/avatar`, formData, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            ...formData.getHeaders()
          }
        });

        if (response.status === 200) {
          successfulUploads++;
        }
      } catch (error) {
        if (error.response?.status === 429) {
          rateLimited = true;
          break;
        }
      }
    }

    if (rateLimited) {
      this.addResult(
        'Upload Rate Limiting',
        'PASS',
        `Rate limiting triggered after ${successfulUploads} uploads`,
        'medium'
      );
    } else {
      this.addResult(
        'Upload Rate Limiting',
        'FAIL',
        `No rate limiting detected after ${successfulUploads} uploads`,
        'medium'
      );
    }
  }

  async cleanup() {
    this.log('Cleaning up test files...');

    try {
      await fs.rm(this.testFilesDir, { recursive: true, force: true });
      this.log('Test files cleaned up successfully');
    } catch (error) {
      this.log(`Failed to clean up test files: ${error.message}`);
    }
  }

  async runAllTests() {
    this.log('Starting File Upload Security Test Suite...');

    const userSetup = await this.setupTestUser();
    if (!userSetup) {
      this.log('Failed to setup test user. Aborting tests.');
      return;
    }

    const filesSetup = await this.createTestFiles();
    if (!filesSetup) {
      this.log('Failed to create test files. Aborting tests.');
      return;
    }

    try {
      await this.testFileTypeValidation();
      await this.testFileSizeValidation();
      await this.testFileContentValidation();
      await this.testFilenameInjection();
      await this.testDirectoryTraversal();
      await this.testFileExecutionPrevention();
      await this.testMimeTypeValidation();
      await this.testUploadRateLimiting();
    } catch (error) {
      this.log(`Error during testing: ${error.message}`);
    }

    await this.cleanup();
    await this.saveResults();
    this.printSummary();
  }

  async saveResults() {
    try {
      const filename = './file-upload-test-results.json';
      await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
      this.log(`Results saved to ${filename}`);
    } catch (error) {
      this.log(`Failed to save results: ${error.message}`);
    }
  }

  printSummary() {
    console.log('\\n=== FILE UPLOAD SECURITY TEST SUMMARY ===');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Critical Issues: ${this.results.summary.critical}`);

    if (this.results.summary.critical > 0) {
      console.log('\\n🚨 CRITICAL SECURITY ISSUES FOUND - IMMEDIATE ACTION REQUIRED');
    } else if (this.results.summary.failed > 0) {
      console.log('\\n⚠️ Security issues found - review and address');
    } else {
      console.log('\\n✅ All file upload security tests passed');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FileUploadSecurityTester();
  tester.runAllTests().catch(console.error);
}

export default FileUploadSecurityTester;