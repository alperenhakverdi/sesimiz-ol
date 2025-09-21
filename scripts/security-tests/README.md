# Sesimiz Ol Security Testing Suite

A comprehensive security testing suite designed to identify vulnerabilities and security weaknesses in the Sesimiz Ol digital storytelling platform.

## Overview

This security testing suite covers multiple aspects of application security:

- **Authentication Security** - JWT tokens, password policies, brute force protection
- **Input Validation** - XSS prevention, SQL injection, content sanitization
- **Authorization** - Access control, privilege escalation, resource ownership
- **File Upload Security** - File type validation, content inspection, path traversal

## Quick Start

### Prerequisites

1. **Running Application**: Ensure the Sesimiz Ol backend is running locally or accessible
2. **Node.js**: Version 18+ required
3. **Network Access**: Tests require HTTP access to the API endpoints

### Installation

```bash
cd scripts/security-tests
npm run install-deps
```

### Running All Tests

```bash
# Run complete security test suite
npm test

# Set custom API endpoint
API_BASE=https://api.sesimiz-ol.com npm test
```

### Running Individual Test Suites

```bash
# Authentication security tests
npm run test:auth

# Input validation tests
npm run test:input

# Authorization tests
npm run test:authz

# File upload security tests
npm run test:upload
```

## Test Suite Details

### 1. Authentication Security Tests (`01-authentication-security-test.js`)

Tests authentication mechanisms and security controls:

- **Weak Password Rejection**: Validates password complexity requirements
- **Brute Force Protection**: Tests account lockout mechanisms
- **JWT Token Security**: Validates token generation and validation
- **Session Security**: Tests session management and timeout
- **Rate Limiting**: Validates authentication rate limiting
- **CSRF Protection**: Tests cross-site request forgery protection

**Sample Output:**
```
[AUTH-SEC] PASS: Weak Password Rejection [MEDIUM]
[AUTH-SEC] PASS: Brute Force Protection [HIGH]
[AUTH-SEC] FAIL: JWT Token Validation [CRITICAL]
```

### 2. Input Validation Tests (`02-input-validation-test.js`)

Tests input validation and sanitization:

- **XSS Protection**: Tests cross-site scripting prevention
- **SQL Injection Protection**: Validates parameterized queries
- **Input Sanitization**: Tests malicious input handling
- **Filename Injection**: Validates file upload security
- **Content Length Validation**: Tests input length restrictions
- **Special Character Handling**: Tests Unicode and control character handling

**Sample Output:**
```
[INPUT-VAL] PASS: XSS Protection [HIGH]
[INPUT-VAL] FAIL: Input Sanitization [HIGH]
[INPUT-VAL] PASS: SQL Injection Protection [CRITICAL]
```

### 3. Authorization Tests (`03-authorization-test.js`)

Tests access control and authorization mechanisms:

- **Horizontal Privilege Escalation**: Tests user-to-user access controls
- **Vertical Privilege Escalation**: Tests role-based access controls
- **Insecure Direct Object Reference**: Tests resource access controls
- **Session Management**: Tests session security and validation
- **API Endpoint Security**: Tests endpoint protection
- **Parameter Pollution**: Tests HTTP parameter pollution vulnerabilities

**Sample Output:**
```
[AUTHZ] FAIL: Horizontal Privilege Escalation - Story Modification [CRITICAL]
[AUTHZ] PASS: Vertical Privilege Escalation - Admin Endpoints [CRITICAL]
[AUTHZ] PASS: Session Management - Expired Token [HIGH]
```

### 4. File Upload Security Tests (`04-file-upload-security-test.js`)

Tests file upload security mechanisms:

- **File Type Validation**: Tests file type restrictions
- **File Size Validation**: Tests file size limits
- **File Content Validation**: Tests file content inspection
- **Filename Injection**: Tests malicious filename handling
- **Directory Traversal**: Tests path traversal prevention
- **File Execution Prevention**: Tests executable file restrictions
- **MIME Type Validation**: Tests MIME type spoofing prevention

**Sample Output:**
```
[FILE-UPLOAD] FAIL: File Type Validation [CRITICAL]
[FILE-UPLOAD] PASS: File Size Validation [MEDIUM]
[FILE-UPLOAD] PASS: Directory Traversal Protection [HIGH]
```

## Configuration

### Environment Variables

```bash
# API endpoint (default: http://localhost:3001/api)
API_BASE=http://localhost:3001/api

# Enable debug logging
DEBUG=true

# Custom test timeouts (milliseconds)
TEST_TIMEOUT=30000
```

### Test Configuration

Tests can be customized by modifying the respective test files:

```javascript
// Customize API base URL
const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';

// Customize test payloads
const xssPayloads = [
  '<script>alert("XSS")</script>',
  // Add custom payloads
];
```

## Output and Reporting

### Console Output

Each test suite provides real-time console output with:
- Test progress indicators
- Pass/fail status for each test
- Severity levels (CRITICAL, HIGH, MEDIUM, LOW)
- Summary statistics

### JSON Reports

Individual test suites generate detailed JSON reports:
- `security-test-results.json` - Authentication tests
- `input-validation-test-results.json` - Input validation tests
- `authorization-test-results.json` - Authorization tests
- `file-upload-test-results.json` - File upload tests

### Consolidated Reports

The main test runner generates comprehensive reports:
- `security-test-report-YYYY-MM-DD.json` - Detailed JSON report
- `security-test-report-YYYY-MM-DD.html` - Visual HTML report

### Report Structure

```json
{
  "timestamp": "2025-09-21T10:30:00.000Z",
  "summary": {
    "totalTests": 25,
    "totalPassed": 18,
    "totalFailed": 7,
    "totalCritical": 2,
    "overallRiskLevel": "HIGH"
  },
  "suites": [...],
  "criticalIssues": [...],
  "recommendations": [...],
  "securityScore": 72
}
```

## Security Test Categories

### Severity Levels

- **CRITICAL**: Immediate security risk requiring urgent action
- **HIGH**: Significant security risk requiring prompt action
- **MEDIUM**: Moderate security risk requiring planned action
- **LOW**: Minor security issue for future consideration

### Risk Assessment

The test suite calculates an overall risk level based on:
- Number of failed tests
- Severity of failures
- Critical security issues identified

Risk levels: CRITICAL, HIGH, MEDIUM, LOW, MINIMAL

## Interpreting Results

### Critical Issues (🚨)

Issues marked as CRITICAL require immediate attention:
- Authentication bypass vulnerabilities
- SQL injection vulnerabilities
- Remote code execution risks
- Data exposure vulnerabilities

### High Priority Issues (⚠️)

Issues requiring prompt attention:
- Cross-site scripting vulnerabilities
- Authorization bypass issues
- Insecure file upload handling
- Session management weaknesses

### Recommendations

Each failed test includes:
- **Priority level** for remediation
- **Specific action** required
- **Implementation guidance**

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3001
   ```
   **Solution**: Ensure the backend server is running

2. **Authentication Failures**
   ```
   Failed to create test user: User registration failed
   ```
   **Solution**: Check API endpoint accessibility and user registration functionality

3. **Test Timeouts**
   ```
   Error: Test timeout after 30000ms
   ```
   **Solution**: Increase timeout or check server response times

### Debug Mode

Enable debug logging for detailed test execution information:

```bash
DEBUG=true npm test
```

### Manual Test Verification

Verify specific security issues manually:

```bash
# Test authentication endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"weak"}'

# Test file upload
curl -X POST http://localhost:3001/api/upload/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@malicious.php"
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Tests
on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Start application
        run: |
          npm install
          npm start &
          sleep 30

      - name: Run security tests
        run: |
          cd scripts/security-tests
          npm run install-deps
          npm test

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: scripts/security-tests/security-test-report-*.html
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    stages {
        stage('Security Tests') {
            steps {
                sh 'npm install'
                sh 'npm start &'
                sh 'sleep 30'
                dir('scripts/security-tests') {
                    sh 'npm run install-deps'
                    sh 'npm test'
                }
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'scripts/security-tests',
                        reportFiles: 'security-test-report-*.html',
                        reportName: 'Security Test Report'
                    ])
                }
            }
        }
    }
}
```

## Contributing

### Adding New Tests

1. **Create test file**: Follow naming convention `XX-test-category.js`
2. **Implement test class**: Extend base testing pattern
3. **Add to main runner**: Include in `run-security-tests.js`
4. **Update documentation**: Add test descriptions and examples

### Test Development Guidelines

- **Isolated tests**: Each test should be independent
- **Cleanup**: Remove test data after completion
- **Error handling**: Graceful failure handling
- **Documentation**: Clear test descriptions and expected outcomes

## Security Considerations

### Test Safety

- Tests are designed to be non-destructive
- Temporary test data is cleaned up automatically
- No permanent system modifications
- Rate limiting respects application limits

### Responsible Testing

- Only test applications you own or have permission to test
- Use test environments when possible
- Follow responsible disclosure for any real vulnerabilities found
- Respect rate limits and system resources

## Support and Resources

### Documentation Links

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP Top 10](https://owasp.org/Top10/)
- [Security Testing Best Practices](https://owasp.org/www-community/controls/Static_Code_Analysis)

### Getting Help

For issues with the security testing suite:

1. Check the troubleshooting section
2. Review console output for error messages
3. Verify application is running and accessible
4. Check network connectivity and firewall settings

### Updates and Maintenance

Regular updates to the security testing suite include:
- New vulnerability patterns
- Updated test payloads
- Enhanced reporting features
- Performance improvements

Keep the testing suite updated for the most comprehensive security coverage.