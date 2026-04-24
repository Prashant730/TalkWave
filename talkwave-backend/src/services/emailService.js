import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendOTPEmail = async (to, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'TalkWave - Password Reset OTP',
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #6c63ff; letter-spacing: 2px;">${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    })
    console.log(`✓ OTP email sent to ${to}`)
  } catch (err) {
    console.error('Error sending OTP email:', err.message)
  }
}

export const sendWelcomeEmail = async (to, username) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Welcome to TalkWave!',
      html: `
        <h2>Welcome to TalkWave, ${username}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start chatting with friends and colleagues in real-time.</p>
        <a href="${process.env.CLIENT_ORIGIN}/chat" style="background-color: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Open TalkWave</a>
      `,
    })
    console.log(`✓ Welcome email sent to ${to}`)
  } catch (err) {
    console.error('Error sending welcome email:', err.message)
  }
}
