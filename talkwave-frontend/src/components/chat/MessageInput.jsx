import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, X, Send } from 'lucide-react'
import { FileUpload } from './FileUpload'

const MessageInput = ({
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
  replyingTo = null,
  onCancelReply = null,
}) => {
  const [content, setContent] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [attachments, setAttachments] = useState([])
  const typingTimeoutRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [content])

  const handleChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)

    // Trigger typing indicator
    if (!isTyping && newContent.length > 0) {
      setIsTyping(true)
      onTyping?.()
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    if (newContent.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        onStopTyping?.()
      }, 3000)
    } else {
      setIsTyping(false)
      onStopTyping?.()
    }
  }

  const handleFileUploaded = (fileData) => {
    setAttachments((prev) => [...prev, fileData])
    setShowFileUpload(false)
  }

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    if (content.trim().length === 0 && attachments.length === 0) return

    onSend({
      content: content.trim(),
      replyTo: replyingTo?._id,
      attachments,
    })

    setContent('')
    setAttachments([])
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    onStopTyping?.()
  }

  const handleKeyDown = (e) => {
    // Send on Enter (not Ctrl+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Shift + Enter for new line
    if (e.shiftKey && e.key === 'Enter') {
      return // Allow default behavior
    }
  }

  return (
    <div className="border-t border-slate-700 p-4 bg-slate-900">
      {/* Reply Quote */}
      {replyingTo && (
        <div className="mb-3 p-3 bg-slate-800 border-l-2 border-blue-500 rounded flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold">
              Replying to {replyingTo.sender.displayName}
            </p>
            <p className="text-sm text-white truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="ml-2 text-slate-400 hover:text-white transition"
            title="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative group bg-slate-800 rounded-lg p-2 pr-8 flex items-center gap-2"
            >
              {file.resourceType === 'image' && (
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="text-sm">
                <p className="text-white font-medium truncate max-w-[150px]">
                  {file.originalName}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.bytes / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => handleRemoveAttachment(index)}
                className="absolute top-1 right-1 p-1 bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="mb-3">
          <FileUpload
            onFileUploaded={handleFileUploaded}
            onCancel={() => setShowFileUpload(false)}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowFileUpload(!showFileUpload)}
          disabled={disabled}
          className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-slate-300 hover:text-white"
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Send a message... (Shift+Enter for new line)"
          disabled={disabled}
          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-white placeholder-slate-400"
          rows={1}
          maxLength={4000}
        />

        <button
          onClick={handleSend}
          disabled={
            disabled ||
            (content.trim().length === 0 && attachments.length === 0)
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold flex items-center gap-2"
          title="Send (Press Enter)"
        >
          <Send size={18} />
          Send
        </button>
      </div>

      {/* Character Count */}
      {content.length > 0 && (
        <p className="text-xs text-slate-400 mt-1 text-right">
          {content.length}/4000
        </p>
      )}
    </div>
  )
}

export default MessageInput
