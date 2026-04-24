import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  channels: [],
  activeChannelId: null,
  currentChannel: null,
  messages: {}, // { channelId: [messages] }
  members: [],
  loading: false,
  error: null,
}

const channelSlice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    setChannels: (state, action) => {
      state.channels = action.payload
      state.loading = false
      state.error = null
    },

    setActiveChannel: (state, action) => {
      state.activeChannelId = action.payload._id
      state.currentChannel = action.payload
      state.members = action.payload.members || []
      state.loading = false
      state.error = null
    },

    addChannel: (state, action) => {
      state.channels.unshift(action.payload)
    },

    updateChannel: (state, action) => {
      const index = state.channels.findIndex(
        (c) => c._id === action.payload._id,
      )
      if (index > -1) {
        state.channels[index] = action.payload
      }
      if (state.currentChannel?._id === action.payload._id) {
        state.currentChannel = action.payload
        state.members = action.payload.members || []
      }
    },

    removeChannel: (state, action) => {
      state.channels = state.channels.filter((c) => c._id !== action.payload)
      if (state.activeChannelId === action.payload) {
        state.activeChannelId = null
        state.currentChannel = null
        state.members = []
      }
    },

    setChannelMessages: (state, action) => {
      const { channelId, messages } = action.payload
      state.messages[channelId] = messages
    },

    addChannelMessage: (state, action) => {
      const { channelId, message } = action.payload
      if (!state.messages[channelId]) {
        state.messages[channelId] = []
      }
      state.messages[channelId].push(message)
    },

    editChannelMessage: (state, action) => {
      const { channelId, messageId, content } = action.payload
      if (state.messages[channelId]) {
        const msg = state.messages[channelId].find((m) => m._id === messageId)
        if (msg) {
          msg.content = content
          msg.isEdited = true
        }
      }
    },

    deleteChannelMessage: (state, action) => {
      const { channelId, messageId } = action.payload
      if (state.messages[channelId]) {
        const msg = state.messages[channelId].find((m) => m._id === messageId)
        if (msg) {
          msg.isDeleted = true
          msg.content = '[Message deleted]'
        }
      }
    },

    setMembers: (state, action) => {
      state.members = action.payload
    },

    addMember: (state, action) => {
      state.members.push(action.payload)
    },

    removeMember: (state, action) => {
      state.members = state.members.filter(
        (m) => m.userId._id !== action.payload,
      )
    },

    updateMemberRole: (state, action) => {
      const { userId, role } = action.payload
      const member = state.members.find((m) => m.userId._id === userId)
      if (member) {
        member.role = role
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload
    },

    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },

    clearError: (state) => {
      state.error = null
    },

    clearChannelMessages: (state) => {
      state.messages = {}
    },
  },
})

export const {
  setChannels,
  setActiveChannel,
  addChannel,
  updateChannel,
  removeChannel,
  setChannelMessages,
  addChannelMessage,
  editChannelMessage,
  deleteChannelMessage,
  setMembers,
  addMember,
  removeMember,
  updateMemberRole,
  setLoading,
  setError,
  clearError,
  clearChannelMessages,
} = channelSlice.actions

export default channelSlice.reducer
