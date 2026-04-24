import User from '../models/User.js'
import { success, error } from '../utils/apiResponse.js'

export const getAllUsers = async (req, res) => {
  try {
    // Exclude the current user from the list
    const users = await User.find({ _id: { $ne: req.user.id } }).select(
      'username displayName avatar',
    )
    return success(res, users, 'Users retrieved successfully')
  } catch (err) {
    console.error('Get all users error:', err)
    return error(res, 'Failed to fetch users', 500)
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v')
    if (!user) {
      return error(res, 'User not found', 404)
    }
    return success(res, user, 'Profile retrieved successfully')
  } catch (err) {
    console.error('Get user profile error:', err)
    return error(res, 'Failed to fetch profile', 500)
  }
}
