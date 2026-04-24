import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
  },
  content: {
    type: String,
    required: true,
    maxlength: 4000,
  },
  mediaUrl: String,
  mediaType: {
    type: String,
    enum: ['image', 'file', 'video', 'audio'],
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  reactions: [
    {
      emoji: String,
      users: [mongoose.Schema.Types.ObjectId],
    },
  ],
  readBy: [mongoose.Schema.Types.ObjectId],
  isEdited: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  pinnedBy: mongoose.Schema.Types.ObjectId,
  reports: [
    {
      reporterId: mongoose.Schema.Types.ObjectId,
      reason: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Message', messageSchema)
