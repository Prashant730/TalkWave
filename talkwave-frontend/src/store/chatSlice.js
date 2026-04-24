import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  conversations: [],
  activeConversationId: null,
  messages: {}, // { conversationId: [messages] }
  typingUsers: {}, // { conversationId: [userIds] }
  hasMore: {}, // { conversationId: bool }
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload
    },

    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload
    },

    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload
      state.messages[conversationId] = messages
      state.hasMore[conversationId] = messages.length >= 30
    },

    addMessage: (state, action) => {
      const { conversationId, message } = action.payload
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }
      state.messages[conversationId].push(message)
    },

    editMessage: (state, action) => {
      const { conversationId, messageId, updates } = action.payload
      const messages = state.messages[conversationId]
      if (messages) {
        const messageIndex = messages.findIndex((m) => m._id === messageId)
        if (messageIndex > -1) {
          messages[messageIndex] = { ...messages[messageIndex], ...updates }
        }
      }
    },

    deleteMessage: (state, action) => {
      const { conversationId, messageId } = action.payload
      const messages = state.messages[conversationId]
      if (messages) {
        state.messages[conversationId] = messages.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: '[Message deleted]' }
            : m,
        )
      }
    },

    setTypingUsers: (state, action) => {
      const { conversationId, userIds } = action.payload
      state.typingUsers[conversationId] = userIds
    },

    addTypingUser: (state, action) => {
      const { conversationId, userId } = action.payload
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = []
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId)
      }
    },

    removeTypingUser: (state, action) => {
      const { conversationId, userId } = action.payload
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[
          conversationId
        ].filter((id) => id !== userId)
      }
    },

    clearMessages: (state) => {
      state.messages = {}
      state.typingUsers = {}
    },
  },
})

export const {
  setConversations,
  setActiveConversation,
  setMessages,
  addMessage,
  editMessage,
  deleteMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearMessages,
} = chatSlice.actions

export default chatSlice.reducer
