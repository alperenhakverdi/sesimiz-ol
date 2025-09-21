# Security Configuration Guide

## Production Security Checklist

### 1. Environment Variables
- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Change `CSRF_SECRET` to a secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN` for your domain
- [ ] Set up email configuration for password reset

### 2. Database Security
- [ ] Use PostgreSQL in production (not SQLite)
- [ ] Enable SSL for database connections
- [ ] Use strong database credentials
- [ ] Regular database backups

### 3. Server Security
- [ ] Use HTTPS in production
- [ ] Set up proper reverse proxy (nginx)
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

### 4. Authentication Security
- [ ] Strong password requirements
- [ ] Account lockout after failed attempts
- [ ] Session management
- [ ] CSRF protection enabled
- [ ] JWT token expiration

### 5. File Upload Security
- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning
- [ ] Secure file storage

### 6. API Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting per endpoint
- [ ] Authentication required for sensitive operations

## Security Headers

The application includes comprehensive security headers:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **HSTS**: Forces HTTPS in production

## Rate Limiting

Rate limiting is configured for:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **File Upload**: 10 requests per 15 minutes

## CSRF Protection

All state-changing operations require CSRF tokens:

- POST, PUT, DELETE, PATCH requests
- Tokens are generated per session
- Tokens expire with sessions

## Authentication Flow

1. User provides credentials
2. Server validates credentials
3. Server creates JWT tokens
4. Tokens stored in secure HTTP-only cookies
5. CSRF token generated and sent
6. Subsequent requests include CSRF token

## Password Security

- Passwords hashed with bcrypt (12 rounds)
- Account lockout after 5 failed attempts
- 30-minute lockout duration
- Strong password requirements

## Session Management

- JWT tokens with expiration
- Refresh token rotation
- Session invalidation on logout
- Multiple session support per user
