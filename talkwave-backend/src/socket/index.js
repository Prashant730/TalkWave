import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { verifyToken } from '../utils/generateToken.js'

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_ORIGIN,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  })

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error('Authentication error'))
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET)
    if (!decoded) {
      return next(new Error('Invalid token'))
    }

    socket.userId = decoded.id
    next()
  })

  // Connection tracking
  const onlineUsers = new Map()

  io.on('connection', (socket) => {
    console.log(`✓ User ${socket.userId} connected: ${socket.id}`)

    // Track online users
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set())
    }
    onlineUsers.get(socket.userId).add(socket.id)

    // Join user's personal room
    socket.join(`user_${socket.userId}`)

    // Auto-join all conversations and channels (will be implemented with proper lookups)
    socket.on('join:room', (roomId) => {
      socket.join(roomId)
      io.to(roomId).emit('user:joined', { userId: socket.userId })
    })

    socket.on('leave:room', (roomId) => {
      socket.leave(roomId)
      io.to(roomId).emit('user:left', { userId: socket.userId })
    })

    // Message events
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, channelId, content, replyTo, attachments } =
          data
        if (
          (!content || content.trim().length === 0) &&
          (!attachments || attachments.length === 0)
        ) {
          socket.emit('error', {
            message: 'Message must have content or attachments',
          })
          return
        }

        const roomId = conversationId
          ? `conv_${conversationId}`
          : `chan_${channelId}`
        const Message = (await import('../models/Message.js')).default
        const Conversation = (await import('../models/Conversation.js')).default
        const Channel = (await import('../models/Channel.js')).default

        const messageData = {
          sender: socket.userId,
          content: content?.trim() || '',
          conversation: conversationId || null,
          channel: channelId || null,
          replyTo: replyTo || null,
        }

        const message = new Message(messageData)
        await message.save()
        await message.populate('sender', 'username displayName avatar')
        if (replyTo) await message.populate('replyTo')

        // Update last message in conversation/channel
        if (conversationId) {
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastActivityAt: new Date(),
          })
        } else if (channelId) {
          await Channel.findByIdAndUpdate(channelId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
            $inc: { messageCount: 1 },
          })
        }

        // Broadcast to room
        io.to(roomId).emit('message:receive', {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          conversation: message.conversation,
          channel: message.channel,
          replyTo: message.replyTo,
          reactions: message.reactions,
          readBy: message.readBy,
          createdAt: message.createdAt,
          isEdited: false,
          isDeleted: false,
        })
      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data
        const Message = (await import('../models/Message.js')).default

        const message = await Message.findById(messageId)
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Cannot edit this message' })
          return
        }

        message.content = content
        message.isEdited = true
        await message.save()

        const roomId = message.conversation
          ? `conv_${message.conversation}`
          : `chan_${message.channel}`
        io.to(roomId).emit('message:edited', {
          _id: message._id,
          content: message.content,
          isEdited: true,
          updatedAt: message.updatedAt,
        })
      } catch (error) {
        console.error('Error editing message:', error)
        socket.emit('error', { message: 'Failed to edit message' })
      }
    })

    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data
        const Message = (await import('../models/Message.js')).default

        const message = await Message.findById(messageId)
        if (!message || message.sender.toString() !== socket.userId) {
          socket.emit('error', { message: 'Cannot delete this message' })
          return
        }

        message.isDeleted = true
        message.content = '[Message deleted]'
        await message.save()

        const roomId = message.conversation
          ? `conv_${message.conversation}`
          : `chan_${message.channel}`
        io.to(roomId).emit('message:deleted', {
          _id: message._id,
          isDeleted: true,
          content: '[Message deleted]',
        })
      } catch (error) {
        console.error('Error deleting message:', error)
        socket.emit('error', { message: 'Failed to delete message' })
      }
    })

    socket.on('message:reaction', async (data) => {
      try {
        const { messageId, emoji } = data
        const Message = (await import('../models/Message.js')).default

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', { message: 'Message not found' })
          return
        }

        const existingReaction = message.reactions.find(
          (r) => r.emoji === emoji,
        )
        if (existingReaction) {
          const userIndex = existingReaction.users.indexOf(socket.userId)
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1)
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter(
                (r) => r.emoji !== emoji,
              )
            }
          } else {
            existingReaction.users.push(socket.userId)
          }
        } else {
          message.reactions.push({ emoji, users: [socket.userId] })
        }

        await message.save()

        const roomId = message.conversation
          ? `conv_${message.conversation}`
          : `chan_${message.channel}`
        io.to(roomId).emit('message:reaction_update', {
          _id: message._id,
          reactions: message.reactions,
        })
      } catch (error) {
        console.error('Error reacting to message:', error)
        socket.emit('error', { message: 'Failed to add reaction' })
      }
    })

    socket.on('message:read', async (data) => {
      try {
        const { conversationId, messageIds } = data
        const Message = (await import('../models/Message.js')).default

        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: socket.userId } },
        )

        io.to(`conv_${conversationId}`).emit('message:read_ack', {
          conversationId,
          userId: socket.userId,
          messageIds,
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    socket.on('typing:start', (data) => {
      const { roomId } = data
      socket
        .to(roomId)
        .emit('typing:indicator', { userId: socket.userId, roomId })
    })

    socket.on('typing:stop', (data) => {
      const { roomId } = data
      socket.to(roomId).emit('typing:stop', { userId: socket.userId, roomId })
    })

    // Channel events
    socket.on('channel:join', async (data) => {
      try {
        const { channelId } = data
        const Channel = (await import('../models/Channel.js')).default

        const channel = await Channel.findById(channelId)
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' })
          return
        }

        // Check if user is member
        const isMember = channel.members.some(
          (m) => m.userId.toString() === socket.userId,
        )
        if (!isMember && channel.type === 'private') {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        socket.join(`chan_${channelId}`)
        io.to(`chan_${channelId}`).emit('channel:user_joined', {
          userId: socket.userId,
          channelId,
        })
      } catch (error) {
        console.error('Error joining channel:', error)
        socket.emit('error', { message: 'Failed to join channel' })
      }
    })

    socket.on('channel:leave', (data) => {
      const { channelId } = data
      socket.leave(`chan_${channelId}`)
      io.to(`chan_${channelId}`).emit('channel:user_left', {
        userId: socket.userId,
        channelId,
      })
    })

    socket.on('message:pin', async (data) => {
      try {
        const { messageId, channelId } = data
        const Message = (await import('../models/Message.js')).default
        const Channel = (await import('../models/Channel.js')).default

        const channel = await Channel.findById(channelId)
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' })
          return
        }

        // Check if user is owner or admin
        const userRole = channel.members.find(
          (m) => m.userId.toString() === socket.userId,
        )?.role
        if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('error', { message: 'Message not found' })
          return
        }

        message.isPinned = true
        message.pinnedBy = socket.userId
        await message.save()

        if (!channel.pinnedMessages.includes(messageId)) {
          channel.pinnedMessages.push(messageId)
          await channel.save()
        }

        io.to(`chan_${channelId}`).emit('message:pinned', {
          messageId,
          channelId,
          pinnedBy: socket.userId,
        })
      } catch (error) {
        console.error('Error pinning message:', error)
        socket.emit('error', { message: 'Failed to pin message' })
      }
    })

    socket.on('message:unpin', async (data) => {
      try {
        const { messageId, channelId } = data
        const Message = (await import('../models/Message.js')).default
        const Channel = (await import('../models/Channel.js')).default

        const channel = await Channel.findById(channelId)
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' })
          return
        }

        // Check if user is owner or admin
        const userRole = channel.members.find(
          (m) => m.userId.toString() === socket.userId,
        )?.role
        if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        const message = await Message.findById(messageId)
        if (message) {
          message.isPinned = false
          message.pinnedBy = null
          await message.save()
        }

        channel.pinnedMessages = channel.pinnedMessages.filter(
          (id) => id.toString() !== messageId,
        )
        await channel.save()

        io.to(`chan_${channelId}`).emit('message:unpinned', {
          messageId,
          channelId,
        })
      } catch (error) {
        console.error('Error unpinning message:', error)
        socket.emit('error', { message: 'Failed to unpin message' })
      }
    })

    socket.on('disconnect', () => {
      console.log(`✗ User ${socket.userId} disconnected: ${socket.id}`)
      const userSockets = onlineUsers.get(socket.userId)
      if (userSockets) {
        userSockets.delete(socket.id)
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId)
          io.emit('presence:update', {
            userId: socket.userId,
            status: 'offline',
          })
        }
      }
    })
  })

  // Export utility functions
  global.io = io
  global.getOnlineUsers = () => onlineUsers
  global.emitToUser = (userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data)
  }
  global.emitToRoom = (roomId, event, data) => {
    io.to(roomId).emit(event, data)
  }

  return io
}
