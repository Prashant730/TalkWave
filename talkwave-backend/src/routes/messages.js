import express from 'express'
import { body, query, param } from 'express-validator'
import auth from '../middleware/auth.js'
import { validationErrorHandler } from '../middleware/errorHandler.js'
import {
  searchMessages,
  addReaction,
  markAsRead,
  getMessages,
} from '../controllers/messageController.js'

const router = express.Router()

// Protect all routes
router.use(auth)

// Get messages for conversation or channel
router.get(
  '/',
  query('conversationId')
    .isMongoId()
    .optional()
    .withMessage('Invalid conversation ID'),
  query('channelId').isMongoId().optional().withMessage('Invalid channel ID'),
  validationErrorHandler,
  getMessages,
)

// Search messages
router.get(
  '/search',
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  validationErrorHandler,
  searchMessages,
)

// Mark conversation as read
router.post(
  '/read',
  body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  validationErrorHandler,
  markAsRead,
)

// Add reaction to message
router.post(
  '/:messageId/react',
  param('messageId').isMongoId(),
  body('emoji').trim().notEmpty(),
  validationErrorHandler,
  addReaction,
)

export default router
