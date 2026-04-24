import Channel from '../models/Channel.js'
import User from '../models/User.js'
import Message from '../models/Message.js'
import { success, error } from '../utils/apiResponse.js'

// Create a new channel
export const createChannel = async (req, res) => {
  try {
    const { name, description, type } = req.body
    const userId = req.user.id

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return error(res, 'User not found', 404)
    }

    // Check if channel name already exists
    const existingChannel = await Channel.findOne({ name: name.toLowerCase() })
    if (existingChannel) {
      return error(res, 'Channel name already exists', 409)
    }

    // Create new channel
    const newChannel = new Channel({
      name: name.toLowerCase().trim(),
      description: description || '',
      type: type || 'public',
      owner: userId,
      members: [
        {
          userId,
          role: 'owner',
        },
      ],
    })

    await newChannel.save()
    await newChannel.populate('owner', 'username displayName avatar')
    await newChannel.populate('members.userId', 'username displayName avatar')

    return success(res, newChannel, 'Channel created successfully', 201)
  } catch (err) {
    console.error('Create channel error:', err)
    return error(res, 'Failed to create channel', 500)
  }
}

// Get all channels
export const getChannels = async (req, res) => {
  try {
    const userId = req.user.id
    const { type } = req.query

    let query = {}
    if (type === 'public') {
      query.type = 'public'
    } else if (type === 'private') {
      query.type = 'private'
      query['members.userId'] = userId
    }

    const channels = await Channel.find(query)
      .populate('owner', 'username displayName avatar')
      .populate('members.userId', 'username displayName avatar')
      .sort({ lastMessageAt: -1 })
      .limit(50)

    return success(res, channels, 'Channels retrieved successfully')
  } catch (err) {
    console.error('Get channels error:', err)
    return error(res, 'Failed to fetch channels', 500)
  }
}

// Get single channel
export const getChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
      .populate('owner', 'username displayName avatar')
      .populate('members.userId', 'username displayName avatar')
      .populate('lastMessage')

    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is member of private channel
    if (channel.type === 'private') {
      const isMember = channel.members.some(
        (m) => m.userId._id.toString() === userId,
      )
      if (!isMember && channel.owner._id.toString() !== userId) {
        return error(res, 'Access denied', 403)
      }
    }

    return success(res, channel, 'Channel retrieved successfully')
  } catch (err) {
    console.error('Get channel error:', err)
    return error(res, 'Failed to fetch channel', 500)
  }
}

// Update channel
export const updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const { name, description, type, icon, banner } = req.body
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is owner or admin
    const userRole = channel.members.find(
      (m) => m.userId.toString() === userId,
    )?.role
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
      return error(res, 'Access denied', 403)
    }

    // Update fields
    if (name) channel.name = name.toLowerCase().trim()
    if (description) channel.description = description
    if (type) channel.type = type
    if (icon) channel.icon = icon
    if (banner) channel.banner = banner

    await channel.save()
    await channel.populate('owner', 'username displayName avatar')
    await channel.populate('members.userId', 'username displayName avatar')

    return success(res, channel, 'Channel updated successfully')
  } catch (err) {
    console.error('Update channel error:', err)
    return error(res, 'Failed to update channel', 500)
  }
}

// Delete channel (owner only)
export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is owner
    if (channel.owner.toString() !== userId) {
      return error(res, 'Only channel owner can delete', 403)
    }

    // Delete all messages in channel
    await Message.deleteMany({ conversationId: channelId })

    // Delete channel
    await Channel.findByIdAndDelete(channelId)

    return success(res, null, 'Channel deleted successfully')
  } catch (err) {
    console.error('Delete channel error:', err)
    return error(res, 'Failed to delete channel', 500)
  }
}

// Add member to channel
export const addMember = async (req, res) => {
  try {
    const { channelId } = req.params
    const { userId } = req.body
    const requester = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if requester is owner or admin
    const requesterRole = channel.members.find(
      (m) => m.userId.toString() === requester,
    )?.role
    if (
      !requesterRole ||
      (requesterRole !== 'owner' && requesterRole !== 'admin')
    ) {
      return error(res, 'Access denied', 403)
    }

    // Check if user already member
    const isMember = channel.members.some((m) => m.userId.toString() === userId)
    if (isMember) {
      return error(res, 'User is already a member', 409)
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return error(res, 'User not found', 404)
    }

    // Add member
    channel.members.push({
      userId,
      role: 'member',
    })

    await channel.save()
    await channel.populate('owner', 'username displayName avatar')
    await channel.populate('members.userId', 'username displayName avatar')

    return success(res, channel, 'Member added successfully')
  } catch (err) {
    console.error('Add member error:', err)
    return error(res, 'Failed to add member', 500)
  }
}

// Remove member from channel
export const removeMember = async (req, res) => {
  try {
    const { channelId, userId } = req.params
    const requester = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if requester is owner or admin
    const requesterRole = channel.members.find(
      (m) => m.userId.toString() === requester,
    )?.role
    if (
      !requesterRole ||
      (requesterRole !== 'owner' && requesterRole !== 'admin')
    ) {
      return error(res, 'Access denied', 403)
    }

    // Cannot remove owner
    if (channel.owner.toString() === userId) {
      return error(res, 'Cannot remove channel owner', 400)
    }

    // Remove member
    channel.members = channel.members.filter(
      (m) => m.userId.toString() !== userId,
    )

    await channel.save()
    await channel.populate('owner', 'username displayName avatar')
    await channel.populate('members.userId', 'username displayName avatar')

    return success(res, channel, 'Member removed successfully')
  } catch (err) {
    console.error('Remove member error:', err)
    return error(res, 'Failed to remove member', 500)
  }
}

// Update member role
export const updateMemberRole = async (req, res) => {
  try {
    const { channelId, userId } = req.params
    const { role } = req.body
    const requester = req.user.id

    // Validate role
    if (!['member', 'admin'].includes(role)) {
      return error(res, 'Invalid role', 400)
    }

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if requester is owner
    if (channel.owner.toString() !== requester) {
      return error(res, 'Only channel owner can change roles', 403)
    }

    // Cannot change owner's role
    if (channel.owner.toString() === userId) {
      return error(res, 'Cannot change owner role', 400)
    }

    // Update member role
    const member = channel.members.find((m) => m.userId.toString() === userId)
    if (!member) {
      return error(res, 'Member not found', 404)
    }

    member.role = role
    await channel.save()
    await channel.populate('owner', 'username displayName avatar')
    await channel.populate('members.userId', 'username displayName avatar')

    return success(res, channel, 'Member role updated successfully')
  } catch (err) {
    console.error('Update member role error:', err)
    return error(res, 'Failed to update member role', 500)
  }
}

// Archive channel
export const archiveChannel = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is owner
    if (channel.owner.toString() !== userId) {
      return error(res, 'Only channel owner can archive', 403)
    }

    channel.isArchived = !channel.isArchived
    await channel.save()

    return success(
      res,
      channel,
      `Channel ${channel.isArchived ? 'archived' : 'restored'} successfully`,
    )
  } catch (err) {
    console.error('Archive channel error:', err)
    return error(res, 'Failed to archive channel', 500)
  }
}

// Get channel messages
export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params
    const { limit = 50, before } = req.query
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is member
    const isMember = channel.members.some((m) => m.userId.toString() === userId)
    if (!isMember && channel.type === 'private') {
      return error(res, 'Access denied', 403)
    }

    let query = { channel: channelId, isDeleted: false }
    if (before) {
      query.createdAt = { $lt: new Date(before) }
    }

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    return success(res, messages.reverse(), 'Messages retrieved successfully')
  } catch (err) {
    console.error('Get channel messages error:', err)
    return error(res, 'Failed to fetch messages', 500)
  }
}

// Pin message
export const pinMessage = async (req, res) => {
  try {
    const { channelId, messageId } = req.params
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is owner or admin
    const userRole = channel.members.find(
      (m) => m.userId.toString() === userId,
    )?.role
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
      return error(res, 'Access denied', 403)
    }

    const message = await Message.findById(messageId)
    if (!message || message.channelId.toString() !== channelId) {
      return error(res, 'Message not found', 404)
    }

    // Check if already pinned
    if (channel.pinnedMessages.includes(messageId)) {
      return error(res, 'Message already pinned', 409)
    }

    channel.pinnedMessages.push(messageId)
    await channel.save()

    return success(res, channel, 'Message pinned successfully')
  } catch (err) {
    console.error('Pin message error:', err)
    return error(res, 'Failed to pin message', 500)
  }
}

// Unpin message
export const unpinMessage = async (req, res) => {
  try {
    const { channelId, messageId } = req.params
    const userId = req.user.id

    const channel = await Channel.findById(channelId)
    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is owner or admin
    const userRole = channel.members.find(
      (m) => m.userId.toString() === userId,
    )?.role
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
      return error(res, 'Access denied', 403)
    }

    channel.pinnedMessages = channel.pinnedMessages.filter(
      (id) => id.toString() !== messageId,
    )
    await channel.save()

    return success(res, channel, 'Message unpinned successfully')
  } catch (err) {
    console.error('Unpin message error:', err)
    return error(res, 'Failed to unpin message', 500)
  }
}

// Get pinned messages
export const getPinnedMessages = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user.id

    const channel = await Channel.findById(channelId).populate({
      path: 'pinnedMessages',
      populate: { path: 'sender', select: 'username displayName avatar' },
    })

    if (!channel) {
      return error(res, 'Channel not found', 404)
    }

    // Check if user is member
    const isMember = channel.members.some((m) => m.userId.toString() === userId)
    if (!isMember && channel.type === 'private') {
      return error(res, 'Access denied', 403)
    }

    return success(
      res,
      channel.pinnedMessages,
      'Pinned messages retrieved successfully',
    )
  } catch (err) {
    console.error('Get pinned messages error:', err)
    return error(res, 'Failed to fetch pinned messages', 500)
  }
}
