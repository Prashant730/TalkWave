import { messaging } from '../config/firebase.js'
import Notification from '../models/Notification.js'

export const createNotification = async ({
  recipientId,
  type,
  fromId,
  channelId,
  conversationId,
  messageId,
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      from: fromId,
      channelId,
      conversationId,
      messageId,
    })

    // Emit via Socket.IO if available
    const io = global.io
    if (io) {
      io.to(`user_${recipientId}`).emit('notification:new', notification)
    }

    return notification
  } catch (err) {
    console.error('Error creating notification:', err.message)
  }
}

export const sendPushNotification = async ({
  recipientId,
  title,
  body,
  data = {},
}) => {
  try {
    const msg = {
      notification: { title, body },
      data: { ...data, recipient: recipientId },
    }

    const response = await messaging().send(msg)
    console.log(`✓ Push notification sent: ${response}`)
  } catch (err) {
    console.error('Error sending push notification:', err.message)
  }
}

export const parseMentions = (content, channelMembers) => {
  const mentionRegex = /@(\w+)/g
  const matches = [...content.matchAll(mentionRegex)]
  const mentioned = []

  for (const match of matches) {
    const username = match[1]
    const user = channelMembers.find((m) => m.username === username)
    if (user) mentioned.push(user)
  }

  return mentioned
}

export const notifyMentions = async ({
  content,
  channelMembers,
  senderId,
  channelId,
  messageId,
}) => {
  const mentioned = parseMentions(content, channelMembers)
  for (const user of mentioned) {
    if (user._id.toString() !== senderId.toString()) {
      await createNotification({
        recipientId: user._id,
        type: 'mention',
        fromId: senderId,
        channelId,
        messageId,
      })
    }
  }
}

export const notifyNewMessage = async ({
  conversationId,
  channelId,
  senderId,
  messageId,
  otherParticipant,
}) => {
  if (conversationId && otherParticipant) {
    await createNotification({
      recipientId: otherParticipant,
      type: 'message',
      fromId: senderId,
      conversationId,
      messageId,
    })
  }
}
