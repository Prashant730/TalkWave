import React, { useEffect, useRef } from 'react'
import Spinner from '../Spinner'
import MessageBubble from './MessageBubble'

const MessageThread = ({
  messages = [],
  loading,
  hasMore,
  onLoadMore,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  canPin = false,
}) => {
  const scrollRef = useRef(null)
  const bottomRef = useRef(null)

  // Ensure messages is always an array
  const messageList = Array.isArray(messages) ? messages : []

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageList])

  if (loading && messageList.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (messageList.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-400">No messages yet. Start a conversation!</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col">
      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mb-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-2">
        {messageList.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            onReply={onReply}
            onReact={onReact}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
            onUnpin={onUnpin}
            canPin={canPin}
          />
        ))}
      </div>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}

export default MessageThread
