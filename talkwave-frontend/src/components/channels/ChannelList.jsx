import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import api from '../api/axios'
import { setChannels, setActiveChannel, setLoading, setError } from '../store/channelSlice'
import { CreateChannelModal } from './modals/CreateChannelModal'
import { ChevronDown, Plus, Lock, Globe } from 'lucide-react'

export const ChannelList = () => {
  const dispatch = useDispatch()
  const { channels, activeChannelId, loading } = useSelector((state) => state.channel)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      dispatch(setLoading(true))
      const response = await api.get('/channels')
      dispatch(setChannels(response.data.data))
    } catch (err) {
      dispatch(setError(err.response?.data?.message || 'Failed to fetch channels'))
    }
  }

  const handleSelectChannel = async (channel) => {
    dispatch(setActiveChannel(channel))
  }

  return (
    <div className="flex flex-col h-full bg-slate-800 border-r border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Channels</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
            title="Create channel"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-12 text-slate-400">
            <span>Loading...</span>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-4 text-center text-slate-400">
            <p>No channels yet</p>
          </div>
        ) : (
          channels.map((channel) => (
            <button
              key={channel._id}
              onClick={() => handleSelectChannel(channel)}
              className={`w-full px-4 py-3 flex items-center gap-3 border-l-2 transition-all ${
                activeChannelId === channel._id
                  ? 'border-blue-500 bg-slate-700 text-white'
                  : 'border-transparent text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {channel.type === 'private' ? (
                <Lock size={16} className="flex-shrink-0" />
              ) : (
                <Globe size={16} className="flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">#{channel.name}</div>
                {channel.description && (
                  <div className="text-xs text-slate-400 truncate">{channel.description}</div>
                )}
              </div>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                {channel.memberCount || 0}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newChannel) => {
            setShowCreateModal(false)
            fetchChannels()
          }}
        />
      )}
    </div>
  )
}
