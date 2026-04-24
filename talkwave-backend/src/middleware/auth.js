import { error } from '../utils/apiResponse.js'
import { verifyToken } from '../utils/generateToken.js'

export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No authorization token provided', 401)
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token, process.env.JWT_SECRET)

    if (!decoded) {
      return error(res, 'Invalid or expired token', 401)
    }

    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch (err) {
    return error(res, 'Authentication error', 401)
  }
}

export default auth
