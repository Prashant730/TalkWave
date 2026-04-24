import axios from 'axios'
import { store } from '../store/index.js'
import { logout, setCredentials } from '../store/authSlice.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
})

// Request interceptor - add JWT token
api.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor - handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only try to refresh once per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )

        const { accessToken, refreshToken, user } = response.data.data

        // Update Redux with new tokens
        store.dispatch(
          setCredentials({ user, token: accessToken, refreshToken }),
        )

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logout())
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
