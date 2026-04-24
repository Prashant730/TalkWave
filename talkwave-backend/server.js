import express from 'express'
import http from 'http'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import morgan from 'morgan'
import session from 'express-session'
import passport from 'passport'
import dotenv from 'dotenv'
import * as Sentry from '@sentry/node'

import { connectDB } from './src/config/db.js'
import { initSocket } from './src/socket/index.js'
import configurePassport from './src/config/passport.js'
import { globalLimiter } from './src/middleware/rateLimiter.js'
import {
  errorHandler,
  validationErrorHandler,
} from './src/middleware/errorHandler.js'
import authRoutes from './src/routes/auth.js'
import conversationRoutes from './src/routes/conversations.js'
import messageRoutes from './src/routes/messages.js'
import channelRoutes from './src/routes/channels.js'
import uploadRoutes from './src/routes/upload.js'
import userRoutes from './src/routes/users.js'

// Initialize Sentry
dotenv.config()
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || 'development',
  })
}

const app = express()
const server = http.createServer(app)

// Security & Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'res.cloudinary.com'],
        connectSrc: ["'self'", process.env.CLIENT_ORIGIN],
        frameSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'same-origin' },
  }),
)

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        process.env.CLIENT_ORIGIN,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
      ]
      if (!origin || allowed.includes(origin)) callback(null, true)
      else callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))

// Session and Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  }),
)

configurePassport()
app.use(passport.initialize())
app.use(passport.session())

// Sentry request handler
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler())
}

// Rate limiting
app.use(globalLimiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// API Routes
app.get('/api', (req, res) => {
  res.json({
    name: 'TalkWave API',
    version: '1.0.0',
    status: 'running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/v1/conversations', conversationRoutes)
app.use('/api/v1/messages', messageRoutes)
app.use('/api/v1/channels', channelRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/users', userRoutes)

// Sentry error handler
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler())
}
app.use(errorHandler)

// Initialize Socket.IO
initSocket(server)

// Database connection and server start
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    server.listen(PORT, () => {
      console.log(`🚀 TalkWave API running on port ${PORT}`)
      console.log(`📡 WebSocket server ready`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

startServer()

export default app
