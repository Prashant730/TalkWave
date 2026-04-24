import React from 'react'
import { formatTimestamp } from '../../utils/formatTime'

const MessageBubble = ({
  message,
  isOwn = false,
  onReply,
  onReact,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = React.useState(false)

  // WhatsApp-style alignment: your messages (isOwn) = right, received messages = left
  const containerStyle = {
    display: 'flex',
    justifyContent: isOwn ? 'flex-end' : 'flex-start',
    marginBottom: '12px',
    width: '100%'
  }

  // WhatsApp-style bubbles with tail effect
  const bubbleClass = isOwn
    ? 'max-w-[65%] px-3 py-2 rounded-lg rounded-tr-none break-words text-white shadow-md'
    : 'max-w-[65%] px-3 py-2 rounded-lg rounded-tl-none break-words text-white shadow-md'

  // Background colors: your messages = #054740 (Dark Teal), received = #202c33 (Dark Gray)
  const bubbleStyle = isOwn
    ? { backgroundColor: '#054740' }
    : { backgroundColor: '#202c33' }

  const replyClass = isOwn
    ? 'mb-2 px-2 py-1 border-l-2 rounded text-xs border-teal-400 bg-black bg-opacity-20'
    : 'mb-2 px-2 py-1 border-l-2 rounded text-xs border-gray-500 bg-black bg-opacity-20'

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Message Bubble */}
      <div className={bubbleClass} style={bubbleStyle}>
        {/* Sender Name for received messages */}
        {!isOwn && (
          <p className="text-xs text-teal-300 font-semibold mb-1">
            {message.sender?.displayName}
          </p>
        )}

        {/* Reply Quote */}
        {message.replyTo && (
          <div className={replyClass}>
            <p className="font-semibold text-xs opacity-90">{message.replyTo.sender?.displayName}</p>
            <p className="truncate opacity-75">{message.replyTo.content}</p>
          </div>
        )}

        {/* Message Content with Timestamp in bottom-right */}
        <div className="flex items-end gap-2">
          <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{message.content}</p>

          {/* Timestamp in bottom-right corner */}
          <div className="flex items-center gap-1 self-end flex-shrink-0">
            <span className="text-[10px] opacity-60 whitespace-nowrap">
              {formatTimestamp(new Date(message.createdAt))}
            </span>
            {/* Read receipts for own messages */}
            {isOwn && (
              <div className="flex">
                <svg className="w-3 h-3 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <svg className="w-3 h-3 opacity-60 -ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className="text-xs cursor-pointer hover:scale-110 transition bg-black bg-opacity-20 px-1.5 py-0.5 rounded-full"
                onClick={() => onReact?.(message._id, reaction.emoji)}
                title={`${reaction.users.length} people`}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
