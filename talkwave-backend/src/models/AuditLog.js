import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  target: String,
  targetId: mongoose.Schema.Types.ObjectId,
  metadata: mongoose.Schema.Types.Mixed,
  ip: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expireAfterSeconds: 7776000 },
  },
})

export default mongoose.model('AuditLog', auditLogSchema)
