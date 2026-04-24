import React from 'react'
import { Phone, Video, Search, MoreVertical } from 'lucide-react'
import Avatar from '../Avatar'
import { formatRelativeTime } from '../../utils/formatTime'

const ConversationHeader = ({ otherParticipant }) => {
  const lastSeen = otherParticipant?.lastSeen ? new Date(otherParticipant.lastSeen) : null
  const isOnline = otherParticipant?.status === 'online'

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-neutral-950 border-b border-neutral-800 shadow-lg">
      {/* Left Section - Contact Info */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar
          src={otherParticipant?.avatar}
          name={otherParticipant?.displayName}
          size="md"
        />
        <div className="min-w-0">
          <h2 className="font-semibold text-white truncate">
            {otherParticipant?.displayName}
          </h2>
        </div>
      </div>

      {/* Right Section - Action Icons */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 rounded-full transition"
          title="Voice call"
        >
          <Phone size={20} />
        </button>
        <button
          className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 rounded-full transition"
          title="Video call"
        >
          <Video size={20} />
        </button>
        <button
          className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 rounded-full transition"
          title="Search"
        >
          <Search size={20} />
        </button>
        <button
          className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-900 rounded-full transition"
          title="More options"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  )
}

export default ConversationHeader
