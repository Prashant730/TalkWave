import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['message', 'mention', 'invite', 'reaction', 'system'],
    required: true,
  },
  from: mongoose.Schema.Types.ObjectId,
  channelId: mongoose.Schema.Types.ObjectId,
  conversationId: mongoose.Schema.Types.ObjectId,
  messageId: mongoose.Schema.Types.ObjectId,
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expireAfterSeconds: 2592000 },
  },
})

export default mongoose.model('Notification', notificationSchema)
