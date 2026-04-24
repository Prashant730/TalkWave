import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
  },
  displayName: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  },
  bio: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'banned'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away'],
    default: 'offline',
  },
  fcmToken: String,
  googleId: String,
  refreshTokenHash: String,
  otpHash: String,
  otpExpiry: Date,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  }
  next()
})

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

export default mongoose.model('User', userSchema)
