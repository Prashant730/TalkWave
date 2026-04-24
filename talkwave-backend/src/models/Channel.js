import mongoose from 'mongoose'

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
      minlength: [3, 'Channel name must be at least 3 characters'],
      maxlength: [50, 'Channel name must not exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description must not exceed 200 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        _id: false,
      },
    ],
    icon: {
      type: String,
      default: null,
    },
    banner: {
      type: String,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
channelSchema.index({ owner: 1 })
channelSchema.index({ 'members.userId': 1 })
channelSchema.index({ type: 1 })

// Virtual for member count
channelSchema.virtual('memberCount').get(function () {
  return this.members.length
})

// Ensure virtuals are included in toJSON
channelSchema.set('toJSON', { virtuals: true })

export default mongoose.model('Channel', channelSchema)
