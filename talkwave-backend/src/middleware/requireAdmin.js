import { error } from '../utils/apiResponse.js'

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return error(res, 'Admin access required', 403)
  }
  next()
}

export default requireAdmin
