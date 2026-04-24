import express from 'express'
import multer from 'multer'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { v2 as cloudinary } from 'cloudinary'
import { fileTypeFromBuffer } from 'file-type'
import auth from '../middleware/auth.js'
import { uploadLimiter } from '../middleware/rateLimiter.js'
import { success, error } from '../utils/apiResponse.js'

const router = express.Router()

// Cloudinary storage config
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/')
    const isVideo = file.mimetype.startsWith('video/')
    return {
      folder: isImage
        ? 'talkwave/images'
        : isVideo
          ? 'talkwave/videos'
          : 'talkwave/files',
      resource_type: isVideo ? 'video' : isImage ? 'image' : 'raw',
      allowed_formats: [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'zip',
        'mp4',
        'mp3',
      ],
    }
  },
})

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'video/mp4',
  'audio/mpeg',
])

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'), false)
    }
  },
})

// POST /api/upload
router.post(
  '/',
  auth,
  uploadLimiter,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, 'File size exceeds 10MB limit', 400)
        }
        return error(res, err.message, 400)
      }
      if (err) {
        return error(res, err.message || 'File type not allowed', 400)
      }
      next()
    })
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return error(res, 'No file uploaded', 400)
      }

      const file = req.file
      const resourceType = file.mimetype.startsWith('image/')
        ? 'image'
        : file.mimetype.startsWith('video/')
          ? 'video'
          : 'file'

      return success(
        res,
        {
          url: file.path,
          publicId: file.filename,
          resourceType,
          originalName: file.originalname,
          bytes: file.size,
          format: file.mimetype,
          mimeType: file.mimetype,
        },
        'File uploaded successfully',
        201,
      )
    } catch (err) {
      console.error('Upload error:', err)
      return error(res, 'Upload failed', 500)
    }
  },
)

export default router
