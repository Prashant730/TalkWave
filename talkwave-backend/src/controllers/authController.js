import { validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/generateToken.js'
import { success, error } from '../utils/apiResponse.js'
import { sendOTPEmail } from '../services/emailService.js'
import jwt from 'jsonwebtoken'

// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

export const register = async (req, res) => {
  try {
    const { username, email, passwordHash, displayName } = req.body

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    })

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return error(res, 'Email already registered', 409)
      }
      return error(res, 'Username already taken', 409)
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName || username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
    })

    await newUser.save()

    // Generate tokens
    const accessToken = generateAccessToken(newUser._id)
    const refreshToken = generateRefreshToken(newUser._id)

    // Store hashed refresh token
    newUser.refreshTokenHash = await bcrypt.hash(refreshToken, 12)
    await newUser.save()

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return success(
      res,
      {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          avatar: newUser.avatar,
          role: newUser.role,
        },
        accessToken,
        refreshToken,
      },
      'User registered successfully',
      201,
    )
  } catch (err) {
    console.error('Register error:', err)
    return error(res, 'Registration failed', 500)
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return error(res, 'Invalid email or password', 401)
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      return error(res, 'Account temporarily locked. Try again later.', 401)
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      // Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
      await user.save()
      return error(res, 'Invalid email or password', 401)
    }

    // Check if banned
    if (user.role === 'banned') {
      return error(res, 'Your account has been banned', 403)
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0
    user.lockUntil = null
    user.status = 'online'
    await user.save()

    // Generate tokens
    const accessToken = generateAccessToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Store hashed refresh token
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 12)
    await user.save()

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return success(
      res,
      {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
      'Logged in successfully',
    )
  } catch (err) {
    console.error('Login error:', err)
    return error(res, 'Login failed', 500)
  }
}

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      return error(res, 'No refresh token provided', 401)
    }

    // Decode the refresh token to get user ID (without verification for now)
    let userId
    try {
      const decoded = jwt.decode(token) // Don't verify, just decode
      userId = decoded?.id
    } catch (err) {
      return error(res, 'Invalid refresh token format', 401)
    }

    if (!userId) {
      return error(res, 'Invalid refresh token', 401)
    }

    const user = await User.findById(userId)
    if (!user || !user.refreshTokenHash) {
      return error(res, 'Invalid refresh token', 401)
    }

    // Verify refresh token hash matches
    const isValid = await bcrypt.compare(token, user.refreshTokenHash)
    if (!isValid) {
      return error(res, 'Invalid refresh token', 401)
    }

    // Issue new tokens (rotate refresh token)
    const newAccessToken = generateAccessToken(user._id)
    const newRefreshToken = generateRefreshToken(user._id)

    user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12)
    await user.save()

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return success(
      res,
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          role: user.role,
        },
      },
      'Token refreshed',
    )
  } catch (err) {
    console.error('Refresh token error:', err)
    return error(res, 'Token refresh failed', 500)
  }
}

export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (user) {
      user.refreshTokenHash = null
      user.status = 'offline'
      await user.save()
    }

    res.clearCookie('refreshToken')
    return success(res, null, 'Logged out successfully')
  } catch (err) {
    console.error('Logout error:', err)
    return error(res, 'Logout failed', 500)
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return 200 for security (don't reveal if email exists)
    if (!user) {
      return success(res, null, 'If email exists, OTP has been sent')
    }

    // Generate and store OTP
    const otp = generateOTP()
    user.otpHash = await bcrypt.hash(otp, 12)
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    await user.save()

    // Send OTP email
    await sendOTPEmail(user.email, otp)

    return success(res, null, 'If email exists, OTP has been sent')
  } catch (err) {
    console.error('Forgot password error:', err)
    return error(res, 'Failed to process request', 500)
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return error(res, 'User not found', 404)
    }

    // Check OTP validity
    if (!user.otpHash || !user.otpExpiry || user.otpExpiry < new Date()) {
      return error(res, 'OTP has expired', 400)
    }

    const isOTPValid = await bcrypt.compare(otp, user.otpHash)
    if (!isOTPValid) {
      return error(res, 'Invalid OTP', 400)
    }

    // Reset password
    user.passwordHash = newPassword
    user.otpHash = null
    user.otpExpiry = null
    user.loginAttempts = 0
    user.lockUntil = null
    await user.save()

    return success(res, null, 'Password reset successfully')
  } catch (err) {
    console.error('Reset password error:', err)
    return error(res, 'Password reset failed', 500)
  }
}

export const googleCallback = async (req, res) => {
  try {
    const user = req.user

    // Find or create user
    let dbUser = await User.findOne({ googleId: user.id })
    if (!dbUser) {
      dbUser = await User.findOne({ email: user.emails[0].value.toLowerCase() })
      if (dbUser) {
        dbUser.googleId = user.id
      } else {
        dbUser = new User({
          username: user.displayName.toLowerCase().replace(/\s+/g, '_'),
          email: user.emails[0].value.toLowerCase(),
          displayName: user.displayName,
          avatar:
            user.photos[0]?.value ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          googleId: user.id,
        })
      }
      await dbUser.save()
    }

    // Generate tokens
    const accessToken = generateAccessToken(dbUser._id)
    const refreshToken = generateRefreshToken(dbUser._id)

    dbUser.refreshTokenHash = await bcrypt.hash(refreshToken, 12)
    await dbUser.save()

    // Redirect with token
    const redirectUrl = `${process.env.CLIENT_ORIGIN}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
    res.redirect(redirectUrl)
  } catch (err) {
    console.error('Google callback error:', err)
    res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=auth_failed`)
  }
}
