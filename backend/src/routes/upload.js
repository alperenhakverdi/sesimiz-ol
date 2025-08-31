import express from 'express';
import rateLimit from 'express-rate-limit';
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

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per windowMs
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Çok fazla dosya yükleme denemesi. Lütfen 15 dakika sonra tekrar deneyin.'
    }
  }
});

// POST /api/upload/avatar - Upload avatar (standalone)
router.post('/avatar', 
  uploadLimiter,
  authenticateToken,
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

// Serve uploaded files
router.use('/files', express.static(path.join(__dirname, '../../uploads')));

// GET /uploads/* - Serve uploaded files with proper headers
router.get('/avatars/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
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
    } catch {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'Dosya bulunamadı'
        }
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FILE_SERVE_ERROR',
        message: 'Dosya gönderilemedi'
      }
    });
  }
});

// DELETE /api/upload/avatar/:filename - Delete uploaded avatar (admin only)
router.delete('/avatar/:filename', 
  authenticateToken,
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