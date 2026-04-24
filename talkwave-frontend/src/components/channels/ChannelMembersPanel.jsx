import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { X, Shield, UserMinus, Plus } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { removeMember, updateMemberRole } from '../../store/channelSlice'
import  Avatar  from '../Avatar'

export const ChannelMembersPanel = ({ isOpen, onClose }) => {
  const { currentChannel, members } = useSelector((state) => state.channel)
  const { user } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)

  if (!currentChannel || !isOpen) return null

  const isOwner = currentChannel.owner._id === user?.id
  const userRole = currentChannel.members.find((m) => m.userId._id === user?.id)?.role

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member?')) return

    setLoading(true)
    try {
      await api.delete(`/channels/${currentChannel._id}/members/${memberId}`)
      dispatch(removeMember(memberId))
      toast.success('Member removed')
    } catch (err) {
      toast.error('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId, newRole) => {
    setLoading(true)
    try {
      await api.patch(`/channels/${currentChannel._id}/members/${memberId}/role`, {
        role: newRole,
      })
      dispatch(updateMemberRole({ userId: memberId, role: newRole }))
      toast.success('Member role updated')
    } catch (err) {
      toast.error('Failed to update member role')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Select a user')
      return
    }

    setLoading(true)
    try {
      const response = await api.post(`/channels/${currentChannel._id}/members`, {
        userId: selectedUserId,
      })
      toast.success('Member added')
      setShowAddMember(false)
      setSelectedUserId('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-slate-700 px-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Members ({members.length})</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
        >
          <X size={20} />
        </button>
      </div>

      {/* Add Member Button */}
      {(isOwner || userRole === 'admin') && (
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="mx-4 mt-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center font-medium"
        >
          <Plus size={16} />
          Add Member
        </button>
      )}

      {/* Add Member Form */}
      {showAddMember && (
        <div className="mx-4 mt-3 p-3 bg-slate-700 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Search users..."
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddMember}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => setShowAddMember(false)}
              className="flex-1 px-3 py-2 bg-slate-600 text-slate-200 rounded hover:bg-slate-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        {members.length === 0 ? (
          <div className="p-4 text-center text-slate-400">No members</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {members.map((member) => (
              <div
                key={member.userId._id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-slate-700/50 transition-colors"
              >
                <Avatar
                  user={member.userId}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {member.userId.displayName}
                  </div>
                  <div className="text-xs text-slate-400">@{member.userId.username}</div>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-2">
                  {member.role === 'owner' && (
                    <span className="px-2 py-1 text-xs bg-purple-600 text-white rounded">
                      Owner
                    </span>
                  )}
                  {member.role === 'admin' && (
                    <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded flex items-center gap-1">
                      <Shield size={12} />
                      Admin
                    </span>
                  )}

                  {/* Actions */}
                  {(isOwner || userRole === 'admin') &&
                    member.userId._id !== user?.id &&
                    member.role !== 'owner' && (
                      <div className="flex gap-1">
                        {member.role === 'member' && (
                          <button
                            onClick={() => handleUpdateRole(member.userId._id, 'admin')}
                            disabled={loading}
                            className="p-1 hover:bg-blue-600 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Make admin"
                          >
                            <Shield size={14} />
                          </button>
                        )}
                        {member.role === 'admin' && (
                          <button
                            onClick={() => handleUpdateRole(member.userId._id, 'member')}
                            disabled={loading}
                            className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Remove admin"
                          >
                            <Shield size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.userId._id)}
                          disabled={loading}
                          className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          title="Remove member"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
