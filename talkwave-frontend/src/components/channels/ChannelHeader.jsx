import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Settings, Users, Archive, Trash2, Lock, Globe, Pin } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { removeChannel } from '../../store/channelSlice'

export const ChannelHeader = ({ onMembersClick, onSettingsClick, onPinnedClick }) => {
  const { currentChannel } = useSelector((state) => state.channel)
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!currentChannel) return null

  const isOwner = currentChannel.owner._id === user?.id
  const userRole = currentChannel.members.find((m) => m.userId._id === user?.id)?.role

  const handleArchive = async () => {
    setLoading(true)
    try {
      await api.patch(`/channels/${currentChannel._id}/archive`)
      toast.success(currentChannel.isArchived ? 'Channel restored' : 'Channel archived')
      setShowMenu(false)
    } catch (err) {
      toast.error('Failed to archive channel')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this channel? This action cannot be undone.')) return

    setLoading(true)
    try {
      await api.delete(`/channels/${currentChannel._id}`)
      toast.success('Channel deleted')
      dispatch(removeChannel(currentChannel._id))
      setShowMenu(false)
    } catch (err) {
      toast.error('Failed to delete channel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-16 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between">
      {/* Channel Info */}
      <div className="flex items-center gap-3">
        {currentChannel.type === 'private' ? (
          <Lock size={18} className="text-slate-400" />
        ) : (
          <Globe size={18} className="text-slate-400" />
        )}
        <div>
          <h1 className="text-lg font-bold text-white">#{currentChannel.name}</h1>
          {currentChannel.description && (
            <p className="text-sm text-slate-400">{currentChannel.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 relative">
        <button
          onClick={onPinnedClick}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
          title="Pinned Messages"
        >
          <Pin size={18} />
        </button>

        <button
          onClick={onMembersClick}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
          title="Members"
        >
          <Users size={18} />
        </button>

        {(isOwner || userRole === 'admin') && (
          <>
            <button
              onClick={onSettingsClick}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
              title="Settings"
            >
              <Settings size={18} />
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
            >
              <span className="text-xl">⋮</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-slate-700 rounded-lg shadow-lg z-40 min-w-48">
                {isOwner && (
                  <>
                    <button
                      onClick={handleArchive}
                      disabled={loading}
                      className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <Archive size={16} />
                      {currentChannel.isArchived ? 'Restore Channel' : 'Archive Channel'}
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-600 flex items-center gap-2 transition-colors disabled:opacity-50 border-t border-slate-600"
                    >
                      <Trash2 size={16} />
                      Delete Channel
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
