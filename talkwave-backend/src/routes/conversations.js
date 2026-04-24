import express from 'express'
import { body, param } from 'express-validator'
import auth from '../middleware/auth.js'
import { validationErrorHandler } from '../middleware/errorHandler.js'
import { validateObjectId } from '../middleware/validateObjectId.js'
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} from '../controllers/conversationController.js'

const router = express.Router()

// Protect all routes
router.use(auth)

// Get all conversations for current user
router.get('/', getConversations)

// Get or create conversation with a user
router.post(
  '/',
  body('userId').isMongoId().withMessage('Invalid user ID'),
  validationErrorHandler,
  getOrCreateConversation,
)

// Get messages from a conversation
router.get(
  '/:conversationId/messages',
  param('conversationId').custom((v) =>
    validateObjectId('conversationId')(v, {}),
  ),
  getMessages,
)

// Send message to conversation
router.post(
  '/:conversationId/messages',
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be 1-4000 characters'),
  validationErrorHandler,
  sendMessage,
)

// Edit message
router.put(
  '/:conversationId/messages/:messageId',
  param('conversationId').isMongoId(),
  param('messageId').isMongoId(),
  body('content').trim().isLength({ min: 1, max: 4000 }),
  validationErrorHandler,
  editMessage,
)

// Delete message
router.delete(
  '/:conversationId/messages/:messageId',
  param('conversationId').isMongoId(),
  param('messageId').isMongoId(),
  validationErrorHandler,
  deleteMessage,
)

export default router
