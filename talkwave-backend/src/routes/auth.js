import express from 'express'
import { body } from 'express-validator'
import passport from 'passport'
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleCallback,
} from '../controllers/authController.js'
import auth from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { validationErrorHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Register
router.post(
  '/register',
  authLimiter,
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      'Username must be 3-20 characters, alphanumeric and underscores only',
    ),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('passwordHash')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validationErrorHandler,
  register,
)

// Login
router.post(
  '/login',
  authLimiter,
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
  validationErrorHandler,
  login,
)

// Refresh Token
router.post('/refresh', refreshToken)

// Logout
router.post('/logout', auth, logout)

// Forgot Password
router.post(
  '/forgot-password',
  authLimiter,
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  validationErrorHandler,
  forgotPassword,
)

// Reset Password
router.post(
  '/reset-password',
  authLimiter,
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  validationErrorHandler,
  resetPassword,
)

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
)

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  googleCallback,
)

export default router
