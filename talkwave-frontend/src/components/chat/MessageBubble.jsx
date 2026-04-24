import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Download, File, Image as ImageIcon, Video, Pin } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatTime'
import Avatar from '../Avatar'

const MessageBubble = ({
  message,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  canPin = false,
}) => {
  const { user } = useSelector((state) => state.auth)
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const isOwnMessage = message.sender._id === user?._id
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥']

  const handleReaction = (emoji) => {
    onReact(message._id, emoji)
    setShowReactions(false)
  }

  const getFileIcon = (resourceType) => {
    switch (resourceType) {
      case 'image':
        return <ImageIcon size={16} />
      case 'video':
        return <Video size={16} />
      default:
        return <File size={16} />
    }
  }

  return (
    <div
      className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <Avatar
        src={message.sender.avatar}
        name={message.sender.displayName}
        size="sm"
      />

      <div
        className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        {/* Header */}
        <div
          className={`flex gap-2 mb-1 text-xs text-slate-400 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span className="font-semibold text-white">
            {message.sender.displayName}
          </span>
          <span>{formatRelativeTime(new Date(message.createdAt))}</span>
          {message.isEdited && <span className="italic">(edited)</span>}
          {message.isPinned && (
            <span className="flex items-center gap-1 text-yellow-400">
              <Pin size={12} />
              Pinned
            </span>
          )}
        </div>

        {/* Message Content */}
        <div
          className={`px-4 py-2 rounded-lg break-words ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-slate-800 text-white rounded-bl-none'
          }`}
        >
          {/* Reply Quote */}
          {message.replyTo && (
            <div className="mb-2 pl-2 border-l-2 border-opacity-50 border-current text-xs">
              <p className="font-semibold">
                {message.replyTo.sender?.displayName}
              </p>
              <p className="text-opacity-70">{message.replyTo.content}</p>
            </div>
          )}

          {/* Main Content */}
          {message.content && <p>{message.content}</p>}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((file, index) => (
                <div key={index}>
                  {file.resourceType === 'image' ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                      />
                    </a>
                  ) : file.resourceType === 'video' ? (
                    <video
                      src={file.url}
                      controls
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-slate-700 rounded hover:bg-slate-600 transition"
                    >
                      {getFileIcon(file.resourceType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(file.bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Download size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReaction(reaction.emoji)}
                  className="px-2 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-sm transition"
                  title={
                    reaction.users.length > 0
                      ? `${reaction.users.length} reactions`
                      : ''
                  }
                >
                  {reaction.emoji}{' '}
                  {reaction.users.length > 1 && reaction.users.length}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Actions */}
        {showActions && (
          <div
            className={`flex gap-1 mt-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Reactions Picker */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-1 rounded hover:bg-slate-700 transition"
                title="Add reaction"
              >
                😊
              </button>
              {showReactions && (
                <div className="absolute bottom-full mb-2 left-0 bg-slate-800 border border-slate-700 rounded-lg p-2 flex gap-1 z-10">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="p-1 hover:bg-slate-700 rounded transition text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              onClick={() => {
                onReply(message)
                setShowActions(false)
              }}
              className="p-1 rounded hover:bg-slate-700 transition text-xs"
              title="Reply"
            >
              ↩️
            </button>

            {/* Pin Button (Admins/Owners only) */}
            {canPin && (
              <button
                onClick={() => {
                  if (message.isPinned) {
                    onUnpin?.(message._id)
                  } else {
                    onPin?.(message._id)
                  }
                  setShowActions(false)
                }}
                className="p-1 rounded hover:bg-slate-700 transition text-xs"
                title={message.isPinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
            )}

            {/* Edit Button (Own Messages) */}
            {isOwnMessage && (
              <button
                onClick={() => {
                  onEdit(message)
                  setShowActions(false)
                }}
                className="p-1 rounded hover:bg-slate-700 transition text-xs"
                title="Edit"
              >
                ✏️
              </button>
            )}

            {/* Delete Button (Own Messages) */}
            {isOwnMessage && (
              <button
                onClick={() => {
                  if (window.confirm('Delete this message?')) {
                    onDelete(message._id)
                    setShowActions(false)
                  }
                }}
                className="p-1 rounded hover:bg-red-600 hover:bg-opacity-20 transition text-xs"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
