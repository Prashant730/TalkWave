import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    validate: {
      validator: (v) => v.length === 2,
      message: 'Conversation must have exactly 2 participants',
    },
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Conversation', conversationSchema)
