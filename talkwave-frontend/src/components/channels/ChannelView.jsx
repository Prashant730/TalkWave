import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import {
  setActiveChannel,
  setChannelMessages,
  addChannelMessage,
  editChannelMessage,
  deleteChannelMessage,
  setLoading,
  setError,
} from '../../store/channelSlice'
import { ChannelHeader } from './ChannelHeader'
import { ChannelMembersPanel } from './ChannelMembersPanel'
import { PinnedMessagesPanel } from './PinnedMessagesPanel'
import { MessageThread } from '../chat/MessageThread'
import { MessageInput } from '../chat/MessageInput'
import { useSocket } from '../../hooks/useSocket'

export const ChannelView = () => {
  const { channelId } = useParams()
  const dispatch = useDispatch()
  const socket = useSocket()
  const { currentChannel, messages } = useSelector((state) => state.channel)
  const { user } = useSelector((state) => state.auth)
  const [showMembers, setShowMembers] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)

  useEffect(() => {
    if (channelId) {
      fetchChannel()
      fetchMessages()
      joinChannel()
    }

    return () => {
      if (channelId && socket) {
        socket.emit('channel:leave', { channelId })
      }
    }
  }, [channelId])

  useEffect(() => {
    if (!socket || !channelId) return

    const handleMessageReceive = (message) => {
      if (message.channelId === channelId) {
        dispatch(addChannelMessage({ channelId, message }))
      }
    }

    const handleMessageEdited = ({ _id, content, isEdited }) => {
      dispatch(editChannelMessage({ channelId, messageId: _id, content }))
    }

    const handleMessageDeleted = ({ _id }) => {
      dispatch(deleteChannelMessage({ channelId, messageId: _id }))
    }

    const handleMessagePinned = ({ messageId }) => {
      // Refresh messages to show pin status
      fetchMessages()
    }

    const handleMessageUnpinned = ({ messageId }) => {
      // Refresh messages to show pin status
      fetchMessages()
    }

    socket.on('message:receive', handleMessageReceive)
    socket.on('message:edited', handleMessageEdited)
    socket.on('message:deleted', handleMessageDeleted)
    socket.on('message:pinned', handleMessagePinned)
    socket.on('message:unpinned', handleMessageUnpinned)

    return () => {
      socket.off('message:receive', handleMessageReceive)
      socket.off('message:edited', handleMessageEdited)
      socket.off('message:deleted', handleMessageDeleted)
      socket.off('message:pinned', handleMessagePinned)
      socket.off('message:unpinned', handleMessageUnpinned)
    }
  }, [socket, channelId, dispatch])

  const joinChannel = () => {
    if (socket && channelId) {
      socket.emit('channel:join', { channelId })
    }
  }

  const fetchChannel = async () => {
    try {
      dispatch(setLoading(true))
      const response = await api.get(`/channels/${channelId}`)
      dispatch(setActiveChannel(response.data.data))
    } catch (err) {
      dispatch(
        setError(err.response?.data?.message || 'Failed to fetch channel'),
      )
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/channels/${channelId}/messages`)
      dispatch(setChannelMessages({ channelId, messages: response.data.data }))
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const handleSendMessage = (data) => {
    if (socket) {
      socket.emit('message:send', {
        channelId,
        content: data.content,
        replyTo: data.replyTo,
        attachments: data.attachments,
      })
      setReplyingTo(null)
    }
  }

  const handleEditMessage = (message) => {
    const newContent = prompt('Edit message:', message.content)
    if (newContent && newContent.trim() && socket) {
      socket.emit('message:edit', {
        messageId: message._id,
        content: newContent.trim(),
      })
    }
  }

  const handleDeleteMessage = (messageId) => {
    if (socket) {
      socket.emit('message:delete', { messageId })
    }
  }

  const handleReaction = (messageId, emoji) => {
    if (socket) {
      socket.emit('message:reaction', { messageId, emoji })
    }
  }

  const handlePinMessage = (messageId) => {
    if (socket) {
      socket.emit('message:pin', { messageId, channelId })
    }
  }

  const handleUnpinMessage = (messageId) => {
    if (socket) {
      socket.emit('message:unpin', { messageId, channelId })
    }
  }

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing:start', { roomId: `chan_${channelId}` })
    }
  }

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('typing:stop', { roomId: `chan_${channelId}` })
    }
  }

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <span className="text-slate-400">Loading channel...</span>
      </div>
    )
  }

  const channelMessages = messages[channelId] || []
  const userRole = currentChannel.members.find(
    (m) => m.userId._id === user?.id,
  )?.role
  const canPin = userRole === 'owner' || userRole === 'admin'

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      {/* Header */}
      <ChannelHeader
        onMembersClick={() => setShowMembers(!showMembers)}
        onPinnedClick={() => setShowPinned(!showPinned)}
        onSettingsClick={() => setShowSettings(!showSettings)}
      />

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          <MessageThread
            messages={channelMessages}
            onReply={setReplyingTo}
            onReact={handleReaction}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onPin={handlePinMessage}
            onUnpin={handleUnpinMessage}
            canPin={canPin}
            onLoadMore={() => {
              // Implement pagination
            }}
          />
          <MessageInput
            onSend={handleSendMessage}
            onTyping={handleTyping}
            onStopTyping={handleStopTyping}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>

        {/* Pinned Messages Panel */}
        <PinnedMessagesPanel
          channelId={channelId}
          isOpen={showPinned}
          onClose={() => setShowPinned(false)}
        />

        {/* Members Panel */}
        <ChannelMembersPanel
          isOpen={showMembers}
          onClose={() => setShowMembers(false)}
        />
      </div>
    </div>
  )
}
