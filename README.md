# TalkWave — Real-time Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB. TalkWave supports direct messaging, group channels, file sharing, emoji reactions, and more — styled with a WhatsApp-inspired dark UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
  - [Backend (.env)](#backend-env)
  - [Frontend (.env.local)](#frontend-envlocal)
- [API Overview](#api-overview)
- [Socket Events](#socket-events)
- [Scripts](#scripts)
- [Screenshots](#screenshots)

---

## Features

- **Real-time messaging** via Socket.IO
- **Direct conversations** between users
- **Reply to messages** (threaded replies)
- **File & image uploads** via Cloudinary
- **User authentication** — JWT + Refresh tokens + Google OAuth
- **Rate limiting** and security headers via Helmet
- **WhatsApp-style UI** — dark theme, bubble alignment, pill input

---

## Tech Stack

### Backend

| Technology         | Purpose                           |
| ------------------ | --------------------------------- |
| Node.js + Express  | REST API server                   |
| MongoDB + Mongoose | Database & ODM                    |
| Socket.IO          | Real-time WebSocket communication |
| JWT                | Authentication & authorization    |
| Passport.js        | Google OAuth 2.0                  |
| Cloudinary         | File & image storage              |
| Nodemailer         | Email / OTP delivery              |
| Firebase Admin     | Push notifications                |
| Helmet             | HTTP security headers             |
| express-rate-limit | API rate limiting                 |
| Sentry             | Error monitoring (optional)       |
| bcryptjs           | Password hashing                  |

### Frontend

| Technology       | Purpose                            |
| ---------------- | ---------------------------------- |
| React 18         | UI framework                       |
| Vite             | Build tool & dev server            |
| Redux Toolkit    | Global state management            |
| Redux Persist    | Persist auth state across sessions |
| React Router v6  | Client-side routing                |
| Socket.IO Client | Real-time communication            |
| Axios            | HTTP requests                      |
| Tailwind CSS     | Utility-first styling              |
| Lucide React     | Icon library                       |
| React Hot Toast  | Toast notifications                |
| Recharts         | Admin analytics charts             |

---

## Project Structure

```
talkwave/
├── talkwave-backend/
│   ├── server.js                  # Entry point
│   ├── .env                       # Environment variables
│   └── src/
│       ├── config/
│       │   ├── db.js              # MongoDB connection
│       │   ├── cloudinary.js      # Cloudinary setup
│       │   ├── firebase.js        # Firebase Admin setup
│       │   └── passport.js        # Google OAuth config
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── channelController.js
│       │   ├── conversationController.js
│       │   ├── messageController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── auth.js            # JWT verification
│       │   ├── checkChannelRole.js
│       │   ├── errorHandler.js
│       │   ├── rateLimiter.js
│       │   ├── requireAdmin.js
│       │   └── validateObjectId.js
│       ├── models/
│       │   ├── AuditLog.js
│       │   ├── Channel.js
│       │   ├── Conversation.js
│       │   ├── Message.js
│       │   ├── Notification.js
│       │   └── User.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── channels.js
│       │   ├── conversations.js
│       │   ├── messages.js
│       │   ├── upload.js
│       │   └── users.js
│       ├── services/
│       │   ├── emailService.js
│       │   └── notificationService.js
│       ├── socket/
│       │   └── index.js           # Socket.IO event handlers
│       └── utils/
│           ├── apiResponse.js
│           └── generateToken.js
│
└── talkwave-frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                # Routes definition
        ├── main.jsx               # React entry point
        ├── index.css              # Global styles
        ├── api/
        │   └── axios.js           # Axios instance with interceptors
        ├── components/
        │   ├── layout/
        │   │   ├── SidebarNew.jsx # Conversations & channels list
        │   │   ├── ChatAreaNew.jsx# Main chat area
        │   │   └── InfoPanel.jsx  # Contact/channel info panel
        │   ├── chat/
        │   │   ├── MessageBubbleNew.jsx  # WhatsApp-style message bubble
        │   │   ├── MessageInputNew.jsx   # Pill-shaped message input
        │   │   ├── ConversationHeader.jsx
        │   │   └── TypingIndicator.jsx
        │   ├── channels/
        │   │   ├── ChannelView.jsx
        │   │   ├── ChannelList.jsx
        │   │   ├── ChannelHeader.jsx
        │   │   ├── ChannelMembersPanel.jsx
        │   │   └── PinnedMessagesPanel.jsx
        │   ├── modals/
        │   │   ├── NewChatModal.jsx
        │   │   └── CreateChannelModal.jsx
        │   └── common/
        │       ├── ProtectedRoute.jsx
        │       ├── Spinner.jsx
        │       └── Badge.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useSocket.js
        │   └── useOnlineStatus.js
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Chat.jsx
        │   ├── Profile.jsx
        │   ├── Admin.jsx
        │   └── NotFound.jsx
        ├── store/
        │   ├── index.js           # Redux store + persist config
        │   ├── authSlice.js
        │   ├── chatSlice.js
        │   ├── channelSlice.js
        │   ├── notificationSlice.js
        │   └── uiSlice.js
        └── utils/
            ├── constants.js
            ├── formatTime.js
            └── validators.js
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** or **yarn**
- A **Cloudinary** account (for file uploads)
- A **Gmail** account with App Password
- A **Google Cloud** project (for OAuth — optional)

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd talkwave-backend

# 2. Install dependencies
npm install

# 3. Copy the example env file and fill in your values
cp .env.example .env

# 4. Start the development server
npm run dev
```

The backend will start on `http://localhost:5000`.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd talkwave-frontend

# 2. Install dependencies
npm install

# 3. Copy the example env file and fill in your values
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`.

---

## Environment Variables

### Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/talkwave
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development

# Email (OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-session-secret

# Firebase (optional)
FIREBASE_SERVICE_ACCOUNT={}

# Sentry (optional)
SENTRY_DSN=

# Admin seed user
ADMIN_EMAIL=admin@talkwave.com
ADMIN_PASSWORD=Admin@123456
```

### Frontend `.env.local`

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_SENTRY_DSN=
```

---

## API Overview

All API routes are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| POST   | `/register`        | Register a new user         |
| POST   | `/login`           | Login with email & password |
| POST   | `/logout`          | Logout and clear tokens     |
| POST   | `/refresh`         | Refresh access token        |
| POST   | `/forgot-password` | Send OTP to email           |
| POST   | `/verify-otp`      | Verify OTP code             |
| POST   | `/reset-password`  | Reset password with OTP     |
| GET    | `/google`          | Initiate Google OAuth       |
| GET    | `/google/callback` | Google OAuth callback       |

### Conversations — `/api/v1/conversations`

| Method | Endpoint               | Description                              |
| ------ | ---------------------- | ---------------------------------------- |
| GET    | `/`                    | Get all conversations for current user   |
| POST   | `/`                    | Get or create a conversation with a user |
| GET    | `/:id/messages`        | Get messages in a conversation           |
| POST   | `/:id/messages`        | Send a message                           |
| PUT    | `/:id/messages/:msgId` | Edit a message                           |
| DELETE | `/:id/messages/:msgId` | Delete a message                         |

### Channels — `/api/v1/channels`

| Method | Endpoint        | Description          |
| ------ | --------------- | -------------------- |
| GET    | `/`             | Get all channels     |
| POST   | `/`             | Create a new channel |
| GET    | `/:id`          | Get channel details  |
| PUT    | `/:id`          | Update channel       |
| DELETE | `/:id`          | Delete channel       |
| POST   | `/:id/join`     | Join a channel       |
| POST   | `/:id/leave`    | Leave a channel      |
| GET    | `/:id/messages` | Get channel messages |
| GET    | `/:id/members`  | Get channel members  |
| GET    | `/:id/pinned`   | Get pinned messages  |

### Users — `/api/v1/users`

| Method | Endpoint     | Description              |
| ------ | ------------ | ------------------------ |
| GET    | `/me`        | Get current user profile |
| PUT    | `/me`        | Update profile           |
| GET    | `/search`    | Search users             |
| POST   | `/:id/block` | Block a user             |

### Upload — `/api/v1/upload`

| Method | Endpoint | Description                 |
| ------ | -------- | --------------------------- |
| POST   | `/`      | Upload a file to Cloudinary |

---

## Socket Events

### Client → Server

| Event              | Payload                                              | Description                         |
| ------------------ | ---------------------------------------------------- | ----------------------------------- |
| `join:room`        | `roomId`                                             | Join a conversation or channel room |
| `leave:room`       | `roomId`                                             | Leave a room                        |
| `message:send`     | `{ conversationId?, channelId?, content, replyTo? }` | Send a message                      |
| `message:edit`     | `{ messageId, content }`                             | Edit a message                      |
| `message:delete`   | `{ messageId }`                                      | Delete a message                    |
| `message:reaction` | `{ messageId, emoji }`                               | Toggle a reaction                   |
| `message:read`     | `{ conversationId, messageIds }`                     | Mark messages as read               |
| `message:pin`      | `{ messageId, channelId }`                           | Pin a message                       |
| `message:unpin`    | `{ messageId, channelId }`                           | Unpin a message                     |
| `typing:start`     | `{ roomId }`                                         | Start typing indicator              |
| `typing:stop`      | `{ roomId }`                                         | Stop typing indicator               |
| `channel:join`     | `{ channelId }`                                      | Join a channel room                 |
| `channel:leave`    | `{ channelId }`                                      | Leave a channel room                |

### Server → Client

| Event                     | Payload                                  | Description          |
| ------------------------- | ---------------------------------------- | -------------------- |
| `message:receive`         | Message object                           | New message received |
| `message:edited`          | `{ _id, content, isEdited }`             | Message was edited   |
| `message:deleted`         | `{ _id, isDeleted }`                     | Message was deleted  |
| `message:reaction_update` | `{ _id, reactions }`                     | Reactions updated    |
| `message:read_ack`        | `{ conversationId, userId, messageIds }` | Read receipt         |
| `message:pinned`          | `{ messageId, channelId, pinnedBy }`     | Message pinned       |
| `message:unpinned`        | `{ messageId, channelId }`               | Message unpinned     |
| `typing:indicator`        | `{ userId, roomId }`                     | User is typing       |
| `typing:stop`             | `{ userId, roomId }`                     | User stopped typing  |
| `presence:update`         | `{ userId, status }`                     | User online/offline  |
| `user:joined`             | `{ userId }`                             | User joined room     |
| `user:left`               | `{ userId }`                             | User left room       |
| `error`                   | `{ message }`                            | Server-side error    |

---

## Scripts

### Backend

```bash
npm run dev          # Start with nodemon (hot reload)
npm run start        # Start in production
npm run test         # Run Jest tests
npm run test:coverage # Run tests with coverage report
npm run seed         # Seed admin user
npm run init-db      # Initialize database
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Health Check

```
GET http://localhost:5000/api/health
```

Returns server uptime, timestamp, and environment.

---

## License

MIT
