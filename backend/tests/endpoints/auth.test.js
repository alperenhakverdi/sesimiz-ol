/**
 * Authentication Endpoints Comprehensive Test Suite
 * Tests all authentication-related API endpoints
 */

import request from 'supertest';
import app from '../../src/app.js';
import bcrypt from 'bcryptjs';

describe('Authentication Endpoints', () => {
  let testUser;
  let authToken;
  let refreshToken;

  beforeEach(async () => {
    // Create test user for authentication tests
    testUser = await global.testUtils.createTestUser({
      email: 'auth-test@example.com',
      nickname: 'authtest',
      emailVerified: true
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        nickname: 'newuser',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('başarıyla')
      });

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.nickname).toBe(userData.nickname);

      // Verify user exists in database
      const user = await global.testUtils.prisma().user.findUnique({
        where: { email: userData.email }
      });
      expect(user).toBeTruthy();
      expect(user.emailVerified).toBe(false); // Should require verification
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        email: 'weakpass@example.com',
        nickname: 'weakpass',
        password: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/şifre/i);
    });

    test('should reject registration with mismatched passwords', async () => {
      const userData = {
        email: 'mismatch@example.com',
        nickname: 'mismatch',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/eşleşmiyor/i);
    });

    test('should reject registration with duplicate email', async () => {
      const userData = {
        email: testUser.email,
        nickname: 'duplicate',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    test('should reject registration with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        nickname: 'invalidemail',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/email/i);
    });

    test('should handle avatar upload during registration', async () => {
      const userData = {
        email: 'avatar@example.com',
        nickname: 'avataruser',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .field('email', userData.email)
        .field('nickname', userData.nickname)
        .field('password', userData.password)
        .field('confirmPassword', userData.confirmPassword)
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('avatar');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('başarıyla')
      });

      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      authToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    test('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should reject login for unverified email', async () => {
      const unverifiedUser = await global.testUtils.createTestUser({
        email: 'unverified@example.com',
        emailVerified: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: unverifiedUser.email,
          password: 'password123'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });

    test('should reject login for inactive user', async () => {
      const inactiveUser = await global.testUtils.createTestUser({
        email: 'inactive@example.com',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveUser.email,
          password: 'password123'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      authToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    test('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    test('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });

    test('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        nickname: testUser.nickname
      });

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should reject profile request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should reject profile request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('PUT /api/auth/profile', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should update profile with valid data', async () => {
      const updateData = {
        nickname: 'updatedNickname',
        bio: 'Updated bio information'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nickname).toBe(updateData.nickname);
      expect(response.body.data.user.bio).toBe(updateData.bio);

      // Verify in database
      const updatedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser.nickname).toBe(updateData.nickname);
      expect(updatedUser.bio).toBe(updateData.bio);
    });

    test('should reject profile update with duplicate nickname', async () => {
      const anotherUser = await global.testUtils.createTestUser({
        nickname: 'existingnick'
      });

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nickname: anotherUser.nickname })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NICKNAME_ALREADY_EXISTS');
    });

    test('should update profile with avatar upload', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .field('nickname', 'avatarUpdated')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.nickname).toBe('avatarUpdated');
      expect(response.body.data.user.avatar).toBeTruthy();
    });
  });

  describe('PUT /api/auth/password', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should change password with valid current password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'NewSecurePass456!',
        confirmPassword: 'NewSecurePass456!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/şifre.*değiştirildi/i);

      // Verify password changed in database
      const updatedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: testUser.id }
      });
      const passwordValid = await bcrypt.compare(passwordData.newPassword, updatedUser.password);
      expect(passwordValid).toBe(true);
    });

    test('should reject password change with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'NewSecurePass456!',
        confirmPassword: 'NewSecurePass456!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    test('should reject password change with mismatched new passwords', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'NewSecurePass456!',
        confirmPassword: 'DifferentPass789!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/eşleşmiyor/i);
    });
  });

  describe('GET /api/auth/session', () => {
    test('should check session with valid token', async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);

      const response = await request(app)
        .get('/api/auth/session')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authenticated).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    test('should check session without token (optional auth)', async () => {
      const response = await request(app)
        .get('/api/auth/session')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authenticated).toBe(false);
      expect(response.body.data.user).toBeNull();
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/çıkış/i);
    });

    test('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should logout from all sessions', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/tüm.*oturum/i);
    });
  });

  describe('DELETE /api/auth/account', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should deactivate account successfully', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/hesap.*deaktif/i);

      // Verify account is deactivated
      const deactivatedUser = await global.testUtils.prisma().user.findUnique({
        where: { id: testUser.id }
      });
      expect(deactivatedUser.isActive).toBe(false);
    });
  });

  describe('GET /api/auth/check', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should confirm authentication status', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authenticated).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/check')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Password Reset Flow (Feature Flag Protected)', () => {
    test('should initiate password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/sıfırlama/i);
    });

    test('should verify OTP for password reset', async () => {
      // This would require mocking email service in a real implementation
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: testUser.email,
          otp: '123456'
        })
        .expect(400); // Expected to fail without proper OTP

      expect(response.body.success).toBe(false);
    });

    test('should complete password reset', async () => {
      // This would require valid reset token in a real implementation
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('CSRF Protection', () => {
    beforeEach(async () => {
      authToken = await global.testUtils.generateTestToken(testUser.id);
    });

    test('should get CSRF token', async () => {
      const response = await request(app)
        .get('/api/auth/csrf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('csrfToken');
    });

    // Note: CSRF protection tests would require implementing CSRF middleware
    // and proper token generation/validation
  });

  describe('Rate Limiting', () => {
    test('should handle registration rate limiting', async () => {
      // Multiple rapid requests to test rate limiting
      const promises = Array(10).fill().map((_, i) =>
        request(app)
          .post('/api/auth/register')
          .send({
            email: `ratetest${i}@example.com`,
            nickname: `ratetest${i}`,
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          })
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    test('should validate required fields for registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/gerekli/i);
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email-format',
          nickname: 'testuser',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate nickname length and format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          nickname: 'a', // Too short
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});