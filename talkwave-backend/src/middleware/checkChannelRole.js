import Channel from '../models/Channel.js'
import { error } from '../utils/apiResponse.js'

export const checkChannelRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const { channelId } = req.params
      const channel = await Channel.findById(channelId)

      if (!channel) {
        return error(res, 'Channel not found', 404)
      }

      const member = channel.members.find(
        (m) => m.userId.toString() === req.user.id,
      )
      if (!member) {
        return error(res, 'You are not a member of this channel', 403)
      }

      const roleHierarchy = { owner: 3, admin: 2, member: 1 }
      const requiredLevel = roleHierarchy[requiredRole] || 1
      const userLevel = roleHierarchy[member.role] || 1

      if (userLevel < requiredLevel) {
        return error(res, 'Insufficient permissions', 403)
      }

      req.channelMember = member
      next()
    } catch (err) {
      return error(res, 'Error checking channel role', 500)
    }
  }
}

export default checkChannelRole
