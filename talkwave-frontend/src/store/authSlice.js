import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload
      state.user = user
      state.token = token
      state.refreshToken = refreshToken
      state.isAuthenticated = !!token
      state.loading = false
      state.error = null
    },

    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },

    logout: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
    },

    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },

    setLoading: (state, action) => {
      state.loading = action.payload
    },

    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setCredentials,
  updateUser,
  logout,
  setError,
  setLoading,
  clearError,
} = authSlice.actions

export default authSlice.reducer
