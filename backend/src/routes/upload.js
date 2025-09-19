import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { 
  avatarUpload, 
  processAvatar, 
  validateFileUpload,
  handleUploadError 
} from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadRateLimiter } from '../config/rateLimit.js';
import { csrfMiddleware } from '../utils/csrf.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/upload/avatar - Upload avatar (standalone)
router.post('/avatar', 
  uploadRateLimiter,
  authenticateToken,
  csrfMiddleware,
  avatarUpload.single('avatar'),
  validateFileUpload,
  processAvatar,
  async (req, res) => {
    try {
      if (!req.processedFile) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'PROCESSING_FAILED',
            message: 'Dosya işlenemedi'
          }
        });
      }

      res.json({
        success: true,
        data: {
          file: {
            filename: req.processedFile.filename,
            url: req.processedFile.url,
            size: req.processedFile.size
          }
        },
        message: 'Dosya başarıyla yüklendi'
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Dosya yüklenirken hata oluştu'
        }
      });
    }
  },
  handleUploadError
);

// GET /api/upload/info - Get upload limits and allowed types
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB in bytes
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      formats: {
        avatar: {
          dimensions: '300x300',
          format: 'webp',
          quality: 85
        }
      }
    }
  });
});

// Note: Static files are now served at /uploads/* from app.js with proper CORS headers

// Note: Avatar files are now served directly at /uploads/avatars/:filename from app.js
// This provides better performance and proper CORS handling

// DELETE /api/upload/avatar/:filename - Delete uploaded avatar (admin only)
router.delete('/avatar/:filename', 
  authenticateToken,
  csrfMiddleware,
  async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Validate filename
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILENAME',
            message: 'Geçersiz dosya adı'
          }
        });
      }

      const filePath = path.join(__dirname, '../../uploads/avatars', filename);
      
      // Check if file exists
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        
        res.json({
          success: true,
          message: 'Dosya başarıyla silindi'
        });
      } catch {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: 'Dosya bulunamadı'
          }
        });
      }

    } catch (error) {
      console.error('File delete error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FILE_DELETE_ERROR',
          message: 'Dosya silinirken hata oluştu'
        }
      });
    }
  }
);

export default router;