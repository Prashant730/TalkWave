import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, Smile, Send } from 'lucide-react'

const MessageInputNew = ({
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
}) => {
  const [content, setContent] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const emojis = ['😀', '😂', '❤️', '😍', '🔥', '👍', '😢', '🎉', '🤔', '😎']

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px'
    }
  }, [content])

  const handleChange = (e) => {
    const newContent = e.target.value
    setContent(newContent)

    if (!isTyping && newContent.length > 0) {
      setIsTyping(true)
      onTyping?.()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (content.trim().length === 0) return

    onSend({
      content: content.trim(),
      replyTo: null,
      attachments: [],
    })

    setContent('')
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const addEmoji = (emoji) => {
    setContent(content + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="px-4 py-3 border-t border-neutral-800" style={{ backgroundColor: '#0b141a' }}>
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-2 bg-neutral-900 rounded-lg flex flex-wrap gap-2 border border-neutral-800">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg hover:scale-125 transition hover:bg-neutral-800 p-1 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Area - WhatsApp Pill Design */}
      <div className="flex items-center gap-2">
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 text-neutral-400 hover:text-white transition"
          title="Emoji"
        >
          <Smile size={22} />
        </button>

        {/* Attachment Button */}
        <button
          className="p-2 text-neutral-400 hover:text-white transition"
          title="Attach file"
          disabled={disabled}
        >
          <Paperclip size={22} />
        </button>

        {/* Input Pill - Rounded Full */}
        <div className="flex-1 flex items-center px-4 py-2 bg-neutral-800 rounded-full">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            disabled={disabled}
            className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none resize-none text-sm leading-5"
            rows={1}
            maxLength={4000}
          />
        </div>

        {/* Send Button - Circular Teal Button with Icon Only */}
        <button
          onClick={handleSend}
          disabled={disabled || content.trim().length === 0}
          className="w-11 h-11 flex items-center justify-center rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition hover:brightness-110"
          style={{ backgroundColor: '#00a884' }}
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

export default MessageInputNew
