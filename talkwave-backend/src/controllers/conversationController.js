import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { success, error } from '../utils/apiResponse.js'
import { notifyNewMessage } from '../services/notificationService.js'

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'username displayName avatar status')
      .populate('lastMessage', 'content createdAt sender')
      .sort({ lastActivityAt: -1 })

    const formattedConversations = conversations.map((conv) => ({
      _id: conv._id,
      otherParticipant: conv.participants.find(
        (p) => p._id.toString() !== req.user.id,
      ),
      lastMessage: conv.lastMessage,
      lastActivityAt: conv.lastActivityAt,
      createdAt: conv.createdAt,
    }))

    return success(res, formattedConversations, 'Conversations retrieved')
  } catch (err) {
    console.error('Get conversations error:', err)
    return error(res, 'Failed to fetch conversations', 500)
  }
}

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body

    if (userId === req.user.id) {
      return error(res, 'Cannot create conversation with yourself', 400)
    }

    // Check if user exists
    const otherUser = await User.findById(userId)
    if (!otherUser) {
      return error(res, 'User not found', 404)
    }

    // Find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] },
    })
      .populate('participants', 'username displayName avatar status')
      .populate('lastMessage', 'content createdAt sender')

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [req.user.id, userId],
      })
      await conversation.save()
      await conversation.populate(
        'participants',
        'username displayName avatar status',
      )
    }

    return success(
      res,
      {
        _id: conversation._id,
        otherParticipant: conversation.participants.find(
          (p) => p._id.toString() !== req.user.id,
        ),
        lastMessage: conversation.lastMessage,
        lastActivityAt: conversation.lastActivityAt,
      },
      'Conversation retrieved',
    )
  } catch (err) {
    console.error('Get or create conversation error:', err)
    return error(res, 'Failed to process conversation', 500)
  }
}

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 30 } = req.query

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId)
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return error(res, 'Unauthorized', 403)
    }

    const skip = (page - 1) * limit
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .populate('sender', 'username displayName avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const totalCount = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
    })

    // Reverse to show chronological order
    return success(res, messages.reverse(), 'Messages retrieved')
  } catch (err) {
    console.error('Get messages error:', err)
    return error(res, 'Failed to fetch messages', 500)
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, mediaUrl, mediaType, replyTo } = req.body

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId)
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return error(res, 'Unauthorized', 403)
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      return error(res, 'Message cannot be empty', 400)
    }

    const message = new Message({
      sender: req.user.id,
      conversation: conversationId,
      content: content.trim(),
      mediaUrl,
      mediaType,
      replyTo,
    })

    await message.save()
    await message.populate('sender', 'username displayName avatar')

    // Update conversation
    conversation.lastMessage = message._id
    conversation.lastActivityAt = new Date()
    await conversation.save()

    // Emit via Socket.IO
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user.id,
    )
    global.emitToRoom(`conv_${conversationId}`, 'message:receive', message)

    // Create notification
    await notifyNewMessage({
      conversationId,
      senderId: req.user.id,
      messageId: message._id,
      otherParticipant,
    })

    return success(res, message, 'Message sent', 201)
  } catch (err) {
    console.error('Send message error:', err)
    return error(res, 'Failed to send message', 500)
  }
}

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const { content } = req.body

    const message = await Message.findById(messageId)
    if (!message) {
      return error(res, 'Message not found', 404)
    }

    if (message.sender.toString() !== req.user.id) {
      return error(res, 'Unauthorized', 403)
    }

    message.content = content.trim()
    message.isEdited = true
    await message.save()

    global.emitToRoom(`conv_${message.conversation}`, 'message:edited', {
      messageId: message._id,
      content: message.content,
      editedAt: message.updatedAt,
    })

    return success(res, message, 'Message updated')
  } catch (err) {
    console.error('Edit message error:', err)
    return error(res, 'Failed to edit message', 500)
  }
}

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params

    const message = await Message.findById(messageId)
    if (!message) {
      return error(res, 'Message not found', 404)
    }

    if (message.sender.toString() !== req.user.id) {
      return error(res, 'Unauthorized', 403)
    }

    message.isDeleted = true
    message.content = '[Message deleted]'
    await message.save()

    global.emitToRoom(`conv_${message.conversation}`, 'message:deleted', {
      messageId: message._id,
    })

    return success(res, null, 'Message deleted')
  } catch (err) {
    console.error('Delete message error:', err)
    return error(res, 'Failed to delete message', 500)
  }
}
