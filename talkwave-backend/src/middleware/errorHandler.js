import { error } from '../utils/apiResponse.js'
import { validationResult } from 'express-validator'

export const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0]
    return error(res, `${firstError.param}: ${firstError.msg}`, 422)
  }
  next()
}

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message)
  const status = err.status || 500
  const message = err.message || 'Internal server error'
  return error(res, message, status)
}

export default errorHandler
