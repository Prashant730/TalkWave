import express from 'express'
import { getAllUsers, getUserProfile } from '../controllers/userController.js'
import auth from '../middleware/auth.js'

const router = express.Router()

router.use(auth)

// Get all users (for starting new conversations)
router.get('/', getAllUsers)

// Get user profile
router.get('/profile', getUserProfile)

export default router
