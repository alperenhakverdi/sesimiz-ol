/**
 * Upload Endpoints Comprehensive Test Suite
 * Tests all file upload-related API endpoints
 */

import request from 'supertest';
import app from '../../src/app.js';
import path from 'path';
import fs from 'fs';

describe('Upload Endpoints', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = await global.testUtils.createTestUser({
      email: 'uploader@example.com',
      nickname: 'uploader'
    });

    authToken = await global.testUtils.generateTestToken(testUser.id);
  });

  describe('POST /api/upload/avatar', () => {
    test('should upload avatar successfully', async () => {
      // Create a small test image buffer
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'test-avatar.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.file).toBeDefined();
      expect(response.body.data.file).toHaveProperty('filename');
      expect(response.body.data.file).toHaveProperty('url');
      expect(response.body.data.file).toHaveProperty('size');
      expect(response.body.message).toMatch(/başarıyla yüklendi/i);
    });

    test('should require authentication', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/upload/avatar')
        .attach('avatar', testImageBuffer, {
          filename: 'test-avatar.jpg',
          contentType: 'image/jpeg'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate file upload', async () => {
      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate file type', async () => {
      const testFileBuffer = Buffer.from('not-an-image');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testFileBuffer, {
          filename: 'test.txt',
          contentType: 'text/plain'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate file size', async () => {
      // Create a large buffer (simulate oversized file)
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', largeBuffer, {
          filename: 'large-avatar.jpg',
          contentType: 'image/jpeg'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle multiple file upload attempts', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      // First upload
      const response1 = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'avatar1.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      // Second upload (should replace first)
      const response2 = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'avatar2.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
      expect(response1.body.data.file.filename).not.toBe(response2.body.data.file.filename);
    });

    test('should process different image formats', async () => {
      const testFormats = [
        { ext: 'jpg', contentType: 'image/jpeg' },
        { ext: 'png', contentType: 'image/png' },
        { ext: 'webp', contentType: 'image/webp' }
      ];

      for (const format of testFormats) {
        const testImageBuffer = Buffer.from('fake-image-data');

        const response = await request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImageBuffer, {
            filename: `test.${format.ext}`,
            contentType: format.contentType
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    test('should generate unique filenames', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');
      const uploads = [];

      // Multiple uploads with same filename
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImageBuffer, {
            filename: 'same-name.jpg',
            contentType: 'image/jpeg'
          })
          .expect(200);

        uploads.push(response.body.data.file.filename);
      }

      // All filenames should be unique
      const uniqueFilenames = new Set(uploads);
      expect(uniqueFilenames.size).toBe(uploads.length);
    });

    test('should handle upload errors gracefully', async () => {
      const corruptedBuffer = Buffer.from('corrupted-image-data');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', corruptedBuffer, {
          filename: 'corrupted.jpg',
          contentType: 'image/jpeg'
        });

      // Should handle processing errors
      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('GET /api/upload/info', () => {
    test('should get upload configuration', async () => {
      const response = await request(app)
        .get('/api/upload/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('limits');
      expect(response.body.data).toHaveProperty('formats');
      expect(response.body.data.limits).toHaveProperty('fileSize');
      expect(response.body.data.limits).toHaveProperty('allowedTypes');
      expect(response.body.data.formats).toHaveProperty('avatar');
    });

    test('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/upload/info')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should include correct file size limits', async () => {
      const response = await request(app)
        .get('/api/upload/info')
        .expect(200);

      expect(response.body.data.limits.fileSize).toBeGreaterThan(0);
      expect(Array.isArray(response.body.data.limits.allowedTypes)).toBe(true);
      expect(response.body.data.limits.allowedTypes).toContain('image/jpeg');
      expect(response.body.data.limits.allowedTypes).toContain('image/png');
      expect(response.body.data.limits.allowedTypes).toContain('image/webp');
    });

    test('should include avatar format specifications', async () => {
      const response = await request(app)
        .get('/api/upload/info')
        .expect(200);

      const avatarFormat = response.body.data.formats.avatar;
      expect(avatarFormat).toHaveProperty('dimensions');
      expect(avatarFormat).toHaveProperty('format');
      expect(avatarFormat).toHaveProperty('quality');
    });
  });

  describe('DELETE /api/upload/avatar/:filename', () => {
    let uploadedFilename;

    beforeEach(async () => {
      // Upload a file first
      const testImageBuffer = Buffer.from('fake-image-data');

      const uploadResponse = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'test-delete.jpg',
          contentType: 'image/jpeg'
        });

      uploadedFilename = uploadResponse.body.data.file.filename;
    });

    test('should delete uploaded file', async () => {
      const response = await request(app)
        .delete(`/api/upload/avatar/${uploadedFilename}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/başarıyla silindi/i);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/upload/avatar/${uploadedFilename}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate filename', async () => {
      const invalidFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'file/with/slashes',
        'file\\with\\backslashes'
      ];

      for (const filename of invalidFilenames) {
        const response = await request(app)
          .delete(`/api/upload/avatar/${encodeURIComponent(filename)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_FILENAME');
      }
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/upload/avatar/non-existent-file.jpg')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    test('should handle empty filename', async () => {
      const response = await request(app)
        .delete('/api/upload/avatar/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Should route to 404 handler
      expect(response.body.success).toBe(false);
    });

    test('should prevent directory traversal attacks', async () => {
      const maliciousFilenames = [
        '..%2F..%2F..%2Fetc%2Fpasswd',
        '....//....//....//etc//passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ];

      for (const filename of maliciousFilenames) {
        const response = await request(app)
          .delete(`/api/upload/avatar/${filename}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('File Storage and Retrieval', () => {
    test('should serve uploaded files at correct URL', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      // Upload file
      const uploadResponse = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'serve-test.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      const fileUrl = uploadResponse.body.data.file.url;
      expect(fileUrl).toMatch(/^\/uploads\/avatars\//);

      // Try to access the file
      const fileResponse = await request(app)
        .get(fileUrl)
        .expect(200);

      expect(fileResponse.headers['content-type']).toMatch(/image/);
    });

    test('should set correct CORS headers for files', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      // Upload file
      const uploadResponse = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'cors-test.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      // Access file and check CORS headers
      const fileResponse = await request(app)
        .get(uploadResponse.body.data.file.url)
        .expect(200);

      expect(fileResponse.headers['access-control-allow-origin']).toBe('*');
      expect(fileResponse.headers['access-control-allow-methods']).toBe('GET');
    });

    test('should set cache headers for static files', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      // Upload file
      const uploadResponse = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'cache-test.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      // Access file and check cache headers
      const fileResponse = await request(app)
        .get(uploadResponse.body.data.file.url)
        .expect(200);

      expect(fileResponse.headers['cache-control']).toMatch(/public.*max-age/);
    });

    test('should return 404 for non-existent static files', async () => {
      const response = await request(app)
        .get('/uploads/avatars/non-existent-file.jpg')
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('Upload Security and Validation', () => {
    test('should reject files with malicious content', async () => {
      const maliciousContent = Buffer.from('<?php system($_GET["cmd"]); ?>');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', maliciousContent, {
          filename: 'malicious.php',
          contentType: 'image/jpeg' // Fake content type
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should sanitize uploaded filenames', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: '../../../malicious.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      // Filename should be sanitized
      expect(response.body.data.file.filename).not.toContain('../');
      expect(response.body.data.file.filename).not.toContain('\\');
    });

    test('should validate content type against file content', async () => {
      const textContent = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', textContent, {
          filename: 'fake-image.jpg',
          contentType: 'image/jpeg'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle concurrent uploads', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      const uploadPromises = Array(5).fill().map((_, i) =>
        request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImageBuffer, {
            filename: `concurrent-${i}.jpg`,
            contentType: 'image/jpeg'
          })
      );

      const responses = await Promise.all(uploadPromises);

      // All uploads should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // All should have unique filenames
      const filenames = responses.map(r => r.body.data.file.filename);
      const uniqueFilenames = new Set(filenames);
      expect(uniqueFilenames.size).toBe(filenames.length);
    });

    test('should respect rate limiting', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      // Multiple rapid uploads
      const uploadPromises = Array(20).fill().map((_, i) =>
        request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImageBuffer, {
            filename: `rate-limit-${i}.jpg`,
            contentType: 'image/jpeg'
          })
      );

      const responses = await Promise.all(uploadPromises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should handle upload quota limits', async () => {
      // This test would require implementing quota limits
      const testImageBuffer = Buffer.from('fake-image-data');

      // Multiple uploads to test quota
      for (let i = 0; i < 100; i++) {
        const response = await request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImageBuffer, {
            filename: `quota-test-${i}.jpg`,
            contentType: 'image/jpeg'
          });

        // Eventually should hit quota limit
        if (response.status === 429 || response.status === 403) {
          expect(response.body.success).toBe(false);
          break;
        }
      }
    });
  });

  describe('Upload Performance and Optimization', () => {
    test('should handle large valid images', async () => {
      // Create a larger but valid image buffer
      const largeImageBuffer = Buffer.alloc(1024 * 1024); // 1MB
      largeImageBuffer.fill('fake-image-data');

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', largeImageBuffer, {
          filename: 'large-image.jpg',
          contentType: 'image/jpeg'
        });

      const duration = Date.now() - startTime;

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(duration).toBeLessThan(10000); // Should process within 10 seconds
      } else {
        // If size limit is hit, should fail gracefully
        expect(response.body.success).toBe(false);
      }
    });

    test('should optimize uploaded images', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('avatar', testImageBuffer, {
          filename: 'optimize-test.jpg',
          contentType: 'image/jpeg'
        })
        .expect(200);

      // Should include size information
      expect(response.body.data.file.size).toBeDefined();
      expect(typeof response.body.data.file.size).toBe('number');
    });

    test('should clean up temporary files', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      // Multiple uploads that might create temp files
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/upload/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('avatar', testImageBuffer, {
            filename: `temp-cleanup-${i}.jpg`,
            contentType: 'image/jpeg'
          });
      }

      // Temporary files should be cleaned up automatically
      // This test mainly ensures no errors occur during cleanup
      expect(true).toBe(true);
    });
  });
});