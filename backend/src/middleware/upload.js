import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
// Use Railway persistent volume in production, local path in development
const uploadDir = process.env.NODE_ENV === 'production' 
  ? '/app/uploads' 
  : path.join(__dirname, '../../uploads');
const avatarDir = path.join(uploadDir, 'avatars');

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(avatarDir, { recursive: true });

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'), false);
  }
};

// Multer configuration for avatar uploads
const avatarStorage = multer.memoryStorage(); // Store in memory for processing

export const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1
  }
});

// Process and save avatar image
export const processAvatar = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const userId = req.user?.id || 'temp';
    const timestamp = Date.now();
    const filename = `avatar_${userId}_${timestamp}.webp`;
    const filepath = path.join(avatarDir, filename);

    // Process image with Sharp
    await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Add processed file info to request
    req.processedFile = {
      filename,
      path: filepath,
      url: `/uploads/avatars/${filename}`,
      originalname: req.file.originalname,
      mimetype: 'image/webp',
      size: (await fs.stat(filepath)).size
    };

    next();
  } catch (error) {
    console.error('Avatar processing error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'IMAGE_PROCESSING_FAILED',
        message: 'Failed to process image'
      }
    });
  }
};

// Clean up old avatar when updating
export const cleanupOldAvatar = async (oldAvatarPath) => {
  if (!oldAvatarPath) return;
  
  try {
    const filename = path.basename(oldAvatarPath);
    const fullPath = path.join(avatarDir, filename);
    
    // Check if file exists before deletion
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      console.log(`Cleaned up old avatar: ${filename}`);
    } catch (error) {
      // File doesn't exist, ignore error
    }
  } catch (error) {
    console.error('Error cleaning up old avatar:', error);
  }
};

// Validation middleware for file uploads
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE',
        message: 'No file uploaded'
      }
    });
  }

  // Additional file validation can be added here
  next();
};

// Error handler for multer errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds limit (5MB max)'
        }
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: 'Only one file allowed'
        }
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only JPEG, PNG and WebP images are allowed'
      }
    });
  }

  // Generic upload error
  res.status(500).json({
    success: false,
    error: {
      code: 'UPLOAD_ERROR',
      message: 'File upload failed'
    }
  });
};

export default {
  avatarUpload,
  processAvatar,
  cleanupOldAvatar,
  validateFileUpload,
  handleUploadError
};