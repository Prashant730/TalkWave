import React, { useEffect, useState } from 'react'
import { X, Pin } from 'lucide-react'
import api from '../../api/axios'
import { formatRelativeTime } from '../../utils/formatTime'
import Avatar from '../Avatar'

export const PinnedMessagesPanel = ({ channelId, isOpen, onClose }) => {
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && channelId) {
      fetchPinnedMessages()
    }
  }, [isOpen, channelId])

  const fetchPinnedMessages = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/channels/${channelId}/pinned`)
      setPinnedMessages(response.data.data)
    } catch (err) {
      console.error('Failed to fetch pinned messages:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-slate-700 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin size={18} className="text-yellow-400" />
          <h2 className="text-lg font-bold text-white">Pinned Messages</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
        >
          <X size={20} />
        </button>
      </div>

      {/* Pinned Messages List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-slate-400">Loading...</div>
        ) : pinnedMessages.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <Pin size={32} className="mx-auto mb-2 opacity-50" />
            <p>No pinned messages</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {pinnedMessages.map((message) => (
              <div
                key={message._id}
                className="p-4 hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={message.sender?.avatar}
                    name={message.sender?.displayName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {message.sender?.displayName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(new Date(message.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 break-words">
                      {message.content}
                    </p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2">
                        {message.attachments.map((file, index) => (
                          <div key={index} className="text-xs text-blue-400">
                            📎 {file.originalName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
