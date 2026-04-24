import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const uploadFile = async (file, folder = 'talkwave') => {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.type,
      size: result.bytes,
    }
  } catch (err) {
    console.error('Cloudinary upload error:', err)
    throw new Error('File upload failed')
  }
}

export const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (err) {
    console.error('Cloudinary delete error:', err)
    throw new Error('File deletion failed')
  }
}

export default cloudinary
