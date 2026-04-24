import React, { useState, useEffect } from 'react'
import axios from '../../api/axios'
import Avatar from '../Avatar'
import { X } from 'lucide-react'

export const NewChatModal = ({ isOpen, onRequestClose, onUserSelect }) => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setLoading(true)
        try {
          const response = await axios.get('/v1/users')
          setUsers(response.data.data)
        } catch (error) {
          console.error('Failed to fetch users:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchUsers()
    }
  }, [isOpen])

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl w-96 max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Start a new chat</h2>
          <button
            onClick={onRequestClose}
            className="text-muted hover:text-foreground transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search for a user..."
            className="w-full p-2 bg-neutral-800 border border-border rounded text-foreground placeholder-muted focus:outline-none focus:border-brand"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-muted">
              {users.length === 0 ? 'No users available' : 'No users found'}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredUsers.map(user => (
                <li key={user._id}>
                  <button
                    onClick={() => {
                      onUserSelect(user)
                      onRequestClose()
                    }}
                    className="w-full flex items-center p-3 hover:bg-surface2 transition text-left"
                  >
                    <Avatar src={user.avatar} name={user.displayName} size="sm" />
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.displayName}</p>
                      <p className="text-xs text-muted">@{user.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}