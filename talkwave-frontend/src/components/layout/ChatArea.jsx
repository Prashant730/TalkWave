import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import MessageThread from '../chat/MessageThread'
import MessageInput from '../chat/MessageInput'
import TypingIndicator from '../chat/TypingIndicator'
import Spinner from '../Spinner'
import { setMessages, addMessage, editMessage, deleteMessage } from '../../store/chatSlice'
import {
  setChannelMessages,
  addChannelMessage,
  editChannelMessage,
  deleteChannelMessage
} from '../../store/channelSlice'
import { ChannelHeader } from '../channels/ChannelHeader'
import { ChannelMembersPanel } from '../channels/ChannelMembersPanel'
import { useSocket } from '../../hooks/useSocket'
import axios from '../../api/axios'

const ChatArea = () => {
  const dispatch = useDispatch()
  const { socket } = useSocket()
  const { activeConversationId, messages } = useSelector((state) => state.chat)
  const { activeChannelId, messages: channelMessages } = useSelector((state) => state.channel)
  const { user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [conversationUsers, setConversationUsers] = useState({})
  const [showChannelMembers, setShowChannelMembers] = useState(false)

  // Determine active chat type
  const isChannel = !!activeChannelId && !activeConversationId
  const activeId = activeChannelId || activeConversationId
  const activeMessages = isChannel
    ? (channelMessages[activeChannelId] || [])
    : (messages[activeConversationId] || [])

  // Fetch messages based on active chat
  useEffect(() => {
    if (!activeId) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const url = isChannel
          ? `/v1/messages?channelId=${activeId}&limit=30`
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

          // Build user map
          const userMap = {}
          messagesData.forEach((msg) => {
            if (msg.sender) {
              userMap[msg.sender._id] = msg.sender
            }
          })
          setConversationUsers(userMap)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
        // Set empty messages on error
        if (isChannel) {
          dispatch(setChannelMessages({
            channelId: activeId,
            messages: [],
          }))
        } else {
          dispatch(setMessages({
            conversationId: activeId,
            messages: [],
          }))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()

    // Join appropriate room
    const roomId = isChannel ? `chan_${activeId}` : `conv_${activeId}`
    socket?.emit('join:room', roomId)

    return () => {
      socket?.emit('leave:room', roomId)
    }
  }, [activeId, isChannel, dispatch, socket])

  // Socket listeners
  useEffect(() => {
    if (!socket || !activeId) return

    const roomId = isChannel ? `chan_${activeId}` : `conv_${activeId}`

    socket.on('message:receive', (message) => {
      const messageRoomId = message.channelId
        ? `chan_${message.channelId}`
        : `conv_${message.conversationId}`

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
          conversationUsers[message.sender._id] = message.sender
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

  const handleSendMessage = async (data) => {
    if (!socket || !activeId) return

    const payload = {
      content: data.content,
      replyTo: data.replyTo,
    }

    if (isChannel) {
      payload.channelId = activeId
    } else {
      payload.conversationId = activeId
    }

    socket.emit('message:send', payload)
    setReplyingTo(null)
  }

  const handleEditMessage = (message) => {
    const newContent = prompt('Edit message:', message.content)
    if (newContent && newContent !== message.content) {
      socket?.emit('message:edit', {
        messageId: message._id,
        content: newContent,
      })
    }
  }

  const handleDeleteMessage = (messageId) => {
    socket?.emit('message:delete', { messageId })
  }

  const handleReactMessage = (messageId, emoji) => {
    socket?.emit('message:reaction', { messageId, emoji })
  }

  if (!activeId) {
    return (
      <div className="flex-1 bg-neutral-950 flex items-center justify-center">
        <p className="text-muted">Select a conversation or channel to start messaging</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden">
      {/* Header */}
      {isChannel ? (
        <ChannelHeader
          onMembersClick={() => setShowChannelMembers(!showChannelMembers)}
          onSettingsClick={() => {}}
        />
      ) : (
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold">Conversation</h2>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <MessageThread
            messages={activeMessages}
            loading={loading}
            onReply={setReplyingTo}
            onReact={handleReactMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
          />

          <MessageInput
            conversationId={!isChannel ? activeId : null}
            channelId={isChannel ? activeId : null}
            onSend={handleSendMessage}
          />
        </div>

        {/* Channel Members Panel */}
        {isChannel && (
          <ChannelMembersPanel
            isOpen={showChannelMembers}
            onClose={() => setShowChannelMembers(false)}
          />
        )}
      </div>
    </div>
  )
}

export default ChatArea
