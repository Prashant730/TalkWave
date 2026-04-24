import { error } from '../utils/apiResponse.js'
import mongoose from 'mongoose'

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName]
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, `Invalid ${paramName} format`, 400)
    }
    next()
  }
}

export default validateObjectId
