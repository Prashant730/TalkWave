import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MessageInputNew from '../chat/MessageInputNew'
import ConversationHeader from '../chat/ConversationHeader'
import MessageBubble from '../chat/MessageBubbleNew'
import Spinner from '../Spinner'
import { setMessages, addMessage, editMessage, deleteMessage } from '../../store/chatSlice'
import {
  setChannelMessages,
  addChannelMessage,
  editChannelMessage,
  deleteChannelMessage
} from '../../store/channelSlice'
import { useSocket } from '../../hooks/useSocket'
import axios from '../../api/axios'

const ChatAreaNew = () => {
  const dispatch = useDispatch()
  const { socket } = useSocket()
  const { activeConversationId, messages } = useSelector((state) => state.chat)
  const { activeChannelId, messages: channelMessages } = useSelector((state) => state.channel)
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)
  const [otherParticipant, setOtherParticipant] = useState(null)

  // Determine active chat type
  const isChannel = !!activeChannelId && !activeConversationId
  const activeId = activeChannelId || activeConversationId
  const activeMessages = isChannel
    ? (channelMessages[activeChannelId] || [])
    : (messages[activeConversationId] || [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeMessages])

  // Fetch messages
  useEffect(() => {
    if (!activeId) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const url = isChannel
          ? `/v1/channels/${activeId}/messages?limit=30`
          : `/v1/conversations/${activeId}/messages?limit=30`

        const response = await axios.get(url)
        const messagesData = Array.isArray(response.data.data) ? response.data.data : []

        if (isChannel) {
          dispatch(setChannelMessages({
            channelId: activeId,
            messages: messagesData,
          }))
        } else {
          dispatch(setMessages({
            conversationId: activeId,
            messages: messagesData,
          }))
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Join Socket.IO room
    const roomId = isChannel ? `chan_${activeId}` : `conv_${activeId}`
    socket?.emit('join:room', roomId)

    return () => {
      socket?.emit('leave:room', roomId)
    }
  }, [activeId, isChannel, dispatch, socket])

  // Fetch other participant for header
  useEffect(() => {
    if (!activeId || isChannel) return

    const fetchConversation = async () => {
      try {
        const response = await axios.get(`/v1/conversations`)
        const conv = response.data.data.find(c => c._id === activeId)
        if (conv) {
          setOtherParticipant(conv.otherParticipant)
        }
      } catch (error) {
        console.error('Failed to fetch conversation:', error)
      }
    }

    fetchConversation()
  }, [activeId, isChannel])

  // Socket listeners
  useEffect(() => {
    if (!socket || !activeId) return

    const roomId = isChannel ? `chan_${activeId}` : `conv_${activeId}`

    socket.on('message:receive', (message) => {
      const messageRoomId = message.channel
        ? `chan_${message.channel}`
        : `conv_${message.conversation}`

      if (messageRoomId === roomId) {
        if (isChannel) {
          dispatch(addChannelMessage({
            channelId: activeId,
            message,
          }))
        } else {
          dispatch(addMessage({
            conversationId: activeId,
            message,
          }))
        }
      }
    })

    socket.on('message:edited', (data) => {
      if (activeMessages.find((m) => m._id === data._id)) {
        if (isChannel) {
          dispatch(editChannelMessage({
            channelId: activeId,
            messageId: data._id,
            content: data.content,
          }))
        } else {
          dispatch(editMessage({
            conversationId: activeId,
            messageId: data._id,
            updates: data,
          }))
        }
      }
    })

    socket.on('message:deleted', (data) => {
      if (activeMessages.find((m) => m._id === data._id)) {
        if (isChannel) {
          dispatch(deleteChannelMessage({
            channelId: activeId,
            messageId: data._id,
          }))
        } else {
          dispatch(deleteMessage({
            conversationId: activeId,
            messageId: data._id,
          }))
        }
      }
    })

    return () => {
      socket.off('message:receive')
      socket.off('message:edited')
      socket.off('message:deleted')
    }
  }, [socket, activeId, isChannel, activeMessages, dispatch])

  const handleSendMessage = (data) => {
    console.log('handleSendMessage called with:', data)
    console.log('Socket:', socket)
    console.log('ActiveId:', activeId)

    if (!socket) {
      console.error('No socket connection')
      alert('Not connected to server. Please refresh the page.')
      return
    }

    if (!activeId) {
      console.error('No active conversation/channel')
      alert('No active conversation selected')
      return
    }

    const payload = {
      content: data.content,
      replyTo: data.replyTo,
    }

    if (isChannel) {
      payload.channelId = activeId
    } else {
      payload.conversationId = activeId
    }

    console.log('Emitting message:send with payload:', payload)
    socket.emit('message:send', payload)
  }

  if (!activeId) {
    return (
      <div className="flex-1 bg-neutral-950 flex items-center justify-center">
        <p className="text-neutral-400">Select a conversation to start messaging</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#0b141a' }}>
      {/* Header */}
      {!isChannel && otherParticipant && <ConversationHeader otherParticipant={otherParticipant} />}

      {/* Chat Background - Dark Navy/Black with subtle pattern */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 scroll-smooth"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a',
        }}
      >
        {loading && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}

        {Array.isArray(activeMessages) && activeMessages.map((message) => {
          // Check if sender is a string or object
          const senderName = typeof message.sender === 'string'
            ? message.sender
            : message.sender?.displayName || message.sender?.username

          // Get current user's name
          const currentUserName = user?.displayName || user?.username

          // Compare sender with current user
          const isOwn = senderName === currentUserName

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={isOwn}
              onReact={(messageId, emoji) => {
                socket?.emit('message:reaction', { messageId, emoji })
              }}
            />
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <MessageInputNew
        onSend={handleSendMessage}
        onTyping={() => {}}
        onStopTyping={() => {}}
      />
    </div>
  )
}

export default ChatAreaNew
