import express from 'express'
import { body } from 'express-validator'
import {
  createChannel,
  getChannels,
  getChannel,
  updateChannel,
  deleteChannel,
  addMember,
  removeMember,
  updateMemberRole,
  archiveChannel,
  getChannelMessages,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
} from '../controllers/channelController.js'
import auth from '../middleware/auth.js'
import { validationErrorHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Protect all routes with auth
router.use(auth)

// Create channel
router.post(
  '/',
  body('name')
    .isLength({ min: 3, max: 50 })
    .trim()
    .withMessage('Channel name must be 3-50 characters'),
  body('description')
    .isLength({ max: 200 })
    .optional()
    .trim()
    .withMessage('Description must not exceed 200 characters'),
  body('type')
    .isIn(['public', 'private'])
    .optional()
    .withMessage('Type must be public or private'),
  validationErrorHandler,
  createChannel,
)

// Get all channels
router.get('/', getChannels)

// Get single channel
router.get('/:channelId', getChannel)

// Update channel
router.put(
  '/:channelId',
  body('name')
    .isLength({ min: 3, max: 50 })
    .trim()
    .optional()
    .withMessage('Channel name must be 3-50 characters'),
  body('description')
    .isLength({ max: 200 })
    .optional()
    .trim()
    .withMessage('Description must not exceed 200 characters'),
  validationErrorHandler,
  updateChannel,
)

// Delete channel
router.delete('/:channelId', deleteChannel)

// Archive/restore channel
router.patch('/:channelId/archive', archiveChannel)

// Get channel messages
router.get('/:channelId/messages', getChannelMessages)

// Pin/unpin messages
router.post('/:channelId/messages/:messageId/pin', pinMessage)
router.delete('/:channelId/messages/:messageId/pin', unpinMessage)
router.get('/:channelId/pinned', getPinnedMessages)

// Add member
router.post(
  '/:channelId/members',
  body('userId').isMongoId().withMessage('Invalid user ID'),
  validationErrorHandler,
  addMember,
)

// Remove member
router.delete('/:channelId/members/:userId', removeMember)

// Update member role
router.patch(
  '/:channelId/members/:userId/role',
  body('role').isIn(['member', 'admin']).withMessage('Invalid role'),
  validationErrorHandler,
  updateMemberRole,
)

export default router
