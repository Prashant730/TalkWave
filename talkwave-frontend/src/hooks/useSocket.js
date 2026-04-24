import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import { VITE_SOCKET_URL } from '../utils/constants.js'

let socket = null

export const useSocket = () => {
  const { token } = useSelector((state) => state.auth)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect()
        socket = null
      }
      return
    }

    if (!socket || !socket.connected) {
      socket = io(VITE_SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      socket.on('connect', () => {
        console.log('✓ Connected to server')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('✗ Disconnected from server')
        setIsConnected(false)
      })

      socket.on('error', (error) => {
        console.error('Socket error:', error)
      })
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive
    }
  }, [token])

  const emit = (event, data) => {
    if (socket?.connected) {
      socket.emit(event, data)
    }
  }

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  return { socket, isConnected, emit, on, off }
}

export default useSocket
