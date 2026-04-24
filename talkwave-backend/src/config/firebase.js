import admin from 'firebase-admin'

const initFirebase = () => {
  if (admin.apps.length > 0) {
    return admin
  }

  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || '{}',
    )
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.log('✓ Firebase initialized')
  } catch (err) {
    console.warn(
      '⚠ Firebase initialization skipped (not configured for local development)',
    )
  }

  return admin
}

const firebaseAdmin = initFirebase()

export const messaging = () => {
  try {
    return firebaseAdmin.messaging()
  } catch {
    return null
  }
}

export default firebaseAdmin
