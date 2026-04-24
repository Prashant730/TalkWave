import mongoose from 'mongoose'

let retries = 0
const maxRetries = 5
const retryDelay = 5000 // 5 seconds

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set')
    }

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    })

    console.log(`✓ MongoDB connected: ${mongoose.connection.host}`)
    retries = 0
    return true
  } catch (err) {
    retries++
    if (retries < maxRetries) {
      console.error(
        `✗ MongoDB connection failed (attempt ${retries}/${maxRetries}). Retrying in ${retryDelay / 1000}s...`,
      )
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
      return connectDB()
    } else {
      console.error('✗ MongoDB connection failed after maximum retries')
      process.exit(1)
    }
  }
}

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect()
    console.log('✓ MongoDB disconnected')
  } catch (err) {
    console.error('Error disconnecting from MongoDB:', err.message)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n✓ Gracefully shutting down...')
  await disconnectDB()
  process.exit(0)
})
