import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setConversations, setActiveConversation } from '../../store/chatSlice'
import { setChannels, setActiveChannel } from '../../store/channelSlice'
import Avatar from '../Avatar'
import axios from '../../api/axios'
import { formatRelativeTime } from '../../utils/formatTime'
import { MessageCircle, Hash, PlusCircle, Search } from 'lucide-react'
import { NewChatModal } from '../modals/NewChatModal'
import { useSocket } from '../../hooks/useSocket'

const SidebarNew = () => {
  const dispatch = useDispatch()
  const { socket } = useSocket()
  const { conversations, activeConversationId } = useSelector((state) => state.chat)
  const { channels, activeChannelId } = useSelector((state) => state.channel)
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState('conversations')
  const [isNewChatModalOpen, setNewChatModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('/v1/conversations')
        dispatch(setConversations(response.data.data))
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      }
    }
    fetchConversations()
  }, [dispatch])

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get('/v1/channels')
        dispatch(setChannels(response.data.data))
      } catch (error) {
        console.error('Failed to fetch channels:', error)
      }
    }
    fetchChannels()
  }, [dispatch])

  useEffect(() => {
    if (!socket) return

    socket.on('message:receive', (message) => {
      if (message.conversation) {
        dispatch(setConversations(
          conversations.map(conv =>
            conv._id === message.conversation
              ? {
                  ...conv,
                  lastMessage: message,
                  lastActivityAt: new Date().toISOString()
                }
              : conv
          ).sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))
        ))
      }
    })

    return () => {
      socket.off('message:receive')
    }
  }, [socket, conversations, dispatch])

  const handleNewChat = async (selectedUser) => {
    setNewChatModalOpen(false)
    try {
      const response = await axios.post('/v1/conversations', { userId: selectedUser._id })
      const newConversation = response.data.data
      if (!conversations.some(c => c._id === newConversation._id)) {
        dispatch(setConversations([newConversation, ...conversations]))
      }
      dispatch(setActiveConversation(newConversation._id))

      if (socket) {
        socket.emit('join:room', `conv_${newConversation._id}`)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleConversationClick = (conversation) => {
    dispatch(setActiveConversation(conversation._id))
    setActiveTab('conversations')
  }

  const handleChannelClick = (channel) => {
    dispatch(setActiveChannel(channel))
    setActiveTab('channels')
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherParticipant?.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredChannels = channels.filter(chan =>
    chan.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-80 bg-neutral-950 border-r border-neutral-800 h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="p-4 border-b border-neutral-800">
          <h1 className="text-2xl font-bold text-white">TalkWave</h1>
        </div>

        <div className="px-4 py-3 border-b border-neutral-800">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('conversations')}
              className={activeTab === 'conversations'
                ? 'flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-2 transition text-sm font-medium bg-emerald-700 text-white'
                : 'flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-2 transition text-sm font-medium text-neutral-400 hover:bg-neutral-900'}
            >
              <MessageCircle size={16} />
              Direct
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={activeTab === 'channels'
                ? 'flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-2 transition text-sm font-medium bg-emerald-700 text-white'
                : 'flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-2 transition text-sm font-medium text-neutral-400 hover:bg-neutral-900'}
            >
              <Hash size={16} />
              Channels
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900 rounded-full">
            <Search size={16} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-neutral-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          <>
            <button
              onClick={() => setNewChatModalOpen(true)}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 text-emerald-400 hover:bg-neutral-900 transition text-sm font-medium border-b border-neutral-800"
            >
              <PlusCircle size={16} />
              New Conversation
            </button>

            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-neutral-400 text-sm">
                {searchTerm ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = conversation.otherParticipant
                const isActive = activeConversationId === conversation._id

                return (
                  <button
                    key={conversation._id}
                    onClick={() => handleConversationClick(conversation)}
                    className={isActive
                      ? 'w-full px-4 py-3 flex items-center gap-3 border-b border-neutral-800 hover:bg-neutral-900 transition bg-neutral-900 border-l-4 border-l-emerald-600'
                      : 'w-full px-4 py-3 flex items-center gap-3 border-b border-neutral-800 hover:bg-neutral-900 transition'}
                  >
                    <Avatar
                      src={otherParticipant?.avatar}
                      name={otherParticipant?.displayName}
                      size="sm"
                    />

                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-semibold text-white text-sm">
                        {otherParticipant?.displayName}
                      </h3>
                    </div>

                    {conversation.lastActivityAt && (
                      <span className="text-xs text-neutral-500 flex-shrink-0">
                        {formatRelativeTime(new Date(conversation.lastActivityAt))}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </>
        ) : (
          <>
            {filteredChannels.length === 0 ? (
              <div className="p-4 text-center text-neutral-400 text-sm">
                {searchTerm ? 'No channels found' : 'No channels yet'}
              </div>
            ) : (
              filteredChannels.map((channel) => {
                const isActive = activeChannelId === channel._id

                return (
                  <button
                    key={channel._id}
                    onClick={() => handleChannelClick(channel)}
                    className={isActive
                      ? 'w-full px-4 py-3 flex items-center gap-3 border-b border-neutral-800 hover:bg-neutral-900 transition bg-neutral-900 border-l-4 border-l-emerald-600'
                      : 'w-full px-4 py-3 flex items-center gap-3 border-b border-neutral-800 hover:bg-neutral-900 transition'}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Hash size={18} className="text-white" />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-semibold text-white text-sm">{channel.name}</h3>
                    </div>

                    {channel.lastMessageAt && (
                      <span className="text-xs text-neutral-500 flex-shrink-0">
                        {formatRelativeTime(new Date(channel.lastMessageAt))}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-neutral-800 flex items-center gap-3">
        <Avatar src={user?.avatar} name={user?.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate">{user?.displayName}</h4>
          <p className="text-xs text-neutral-400 truncate">@{user?.username}</p>
        </div>
      </div>

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onRequestClose={() => setNewChatModalOpen(false)}
        onUserSelect={handleNewChat}
      />
    </div>
  )
}

export default SidebarNew
