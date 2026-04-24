import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

const configurePassport = () => {
  // Only configure Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            return done(null, profile)
          } catch (err) {
            return done(err, null)
          }
        },
      ),
    )
  }

  passport.serializeUser((user, done) => {
    done(null, user)
  })

  passport.deserializeUser((user, done) => {
    done(null, user)
  })
}

export default configurePassport
