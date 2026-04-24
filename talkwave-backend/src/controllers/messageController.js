import Message from '../models/Message.js'
import { success, error } from '../utils/apiResponse.js'

export const getMessages = async (req, res) => {
  try {
    const { conversationId, channelId, page = 1, limit = 50 } = req.query
    const userId = req.user.id

    if (!conversationId && !channelId) {
      return error(res, 'Either conversationId or channelId is required', 400)
    }

    const skip = (page - 1) * limit
    const query = { isDeleted: false }

    if (conversationId) {
      query.conversation = conversationId
    } else if (channelId) {
      query.channel = channelId
    }

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    return success(res, messages.reverse(), 'Messages retrieved')
  } catch (err) {
    console.error('Get messages error:', err)
    return error(res, 'Failed to fetch messages', 500)
  }
}

export const searchMessages = async (req, res) => {
  try {
    const { q, channelId, conversationId, page = 1 } = req.query

    if (!q || q.length < 2) {
      return error(res, 'Search query must be at least 2 characters', 400)
    }

    const skip = (page - 1) * 20
    const query = {
      isDeleted: false,
      $text: { $search: q },
    }

    if (channelId) query.channel = channelId
    if (conversationId) query.conversation = conversationId

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .populate('conversation')
      .populate('channel')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(20)

    return success(res, messages, 'Messages found')
  } catch (err) {
    console.error('Search messages error:', err)
    return error(res, 'Search failed', 500)
  }
}

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body

    const message = await Message.findById(messageId)
    if (!message) {
      return error(res, 'Message not found', 404)
    }

    // Find or create reaction
    let reaction = message.reactions.find((r) => r.emoji === emoji)
    if (!reaction) {
      message.reactions.push({ emoji, users: [req.user.id] })
    } else {
      // Toggle user in reaction
      const userIndex = reaction.users.indexOf(req.user.id)
      if (userIndex > -1) {
        reaction.users.splice(userIndex, 1)
        if (reaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji)
        }
      } else {
        reaction.users.push(req.user.id)
      }
    }

    await message.save()

    global.emitToRoom(
      `conv_${message.conversation || message.channel}`,
      'message:reaction_update',
      {
        messageId: message._id,
        reactions: message.reactions,
      },
    )

    return success(res, message, 'Reaction updated')
  } catch (err) {
    console.error('Add reaction error:', err)
    return error(res, 'Failed to add reaction', 500)
  }
}

export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body

    const messages = await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user.id } },
      { $push: { readBy: req.user.id } },
    )

    global.emitToRoom(`conv_${conversationId}`, 'message:read_ack', {
      conversationId,
      readBy: req.user.id,
    })

    return success(res, messages, 'Messages marked as read')
  } catch (err) {
    console.error('Mark as read error:', err)
    return error(res, 'Failed to mark messages as read', 500)
  }
}
