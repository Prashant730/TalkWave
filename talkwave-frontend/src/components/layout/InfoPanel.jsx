import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Mail, Clock, MessageSquare, Image as ImageIcon, FileText, Link as LinkIcon, X } from 'lucide-react';
import axios from '../../api/axios';
import { setActiveConversation } from '../../store/chatSlice';
import { setActiveChannel } from '../../store/channelSlice';

export const InfoPanel = () => {
  const dispatch = useDispatch();
  const { activeConversationId } = useSelector((state) => state.chat);
  const { activeChannelId, channels } = useSelector((state) => state.channel);
  const { user } = useSelector((state) => state.auth);

  const [otherParticipant, setOtherParticipant] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [sharedMedia, setSharedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const isChannel = !!activeChannelId && !activeConversationId;
  const hasActiveChat = activeConversationId || activeChannelId;

  // Fetch conversation/channel details
  useEffect(() => {
    if (!hasActiveChat) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        if (isChannel) {
          // Fetch channel info
          const response = await axios.get(`/v1/channels/${activeChannelId}`);
          setChannelInfo(response.data.data);
        } else {
          // Fetch conversation info
          const response = await axios.get(`/v1/conversations`);
          const conv = response.data.data.find(c => c._id === activeConversationId);
          if (conv) {
            setOtherParticipant(conv.otherParticipant);
          }
        }

        // Fetch shared media
        const mediaUrl = isChannel
          ? `/v1/channels/${activeChannelId}/messages?limit=50`
          : `/v1/conversations/${activeConversationId}/messages?limit=50`;

        const mediaResponse = await axios.get(mediaUrl);
        const messages = mediaResponse.data.data || [];

        // Filter messages with attachments
        const mediaMessages = messages
          .filter(msg => msg.attachments && msg.attachments.length > 0)
          .flatMap(msg => msg.attachments.map(att => ({
            ...att,
            messageId: msg._id,
            createdAt: msg.createdAt
          })))
          .slice(0, 9); // Show only first 9 media items

        setSharedMedia(mediaMessages);
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activeConversationId, activeChannelId, isChannel, hasActiveChat]);

  const handleBlockContact = async () => {
    if (!otherParticipant) return;

    try {
      await axios.post(`/v1/users/${otherParticipant._id}/block`);
      alert('Contact blocked successfully');
      setShowBlockConfirm(false);
    } catch (error) {
      console.error('Failed to block contact:', error);
      alert('Failed to block contact');
    }
  };

  const handleDeleteChat = async () => {
    try {
      if (isChannel) {
        // Leave channel
        await axios.post(`/v1/channels/${activeChannelId}/leave`);
        dispatch(setActiveChannel(null));
        alert('Left channel successfully');
      } else {
        // For conversations, just clear from UI (no backend delete endpoint exists)
        dispatch(setActiveConversation(null));
        alert('Chat cleared from view');
      }
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to perform action:', error);
      const errorMsg = error.response?.data?.message || 'Failed to perform action';
      alert(errorMsg);
      setShowDeleteConfirm(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!hasActiveChat) {
    return (
      <div className="hidden lg:flex w-72 flex-col" style={{ backgroundColor: '#0b141a', borderLeft: '1px solid #202c33' }}>
        <div className="p-4 border-b" style={{ borderColor: '#202c33' }}>
          <h3 className="font-semibold text-white">Contact Info</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <p className="text-neutral-500 text-sm text-center">Select a chat to view details</p>
        </div>
      </div>
    );
  }

  const displayInfo = isChannel ? channelInfo : otherParticipant;
  const displayName = isChannel
    ? channelInfo?.name
    : otherParticipant?.displayName || otherParticipant?.username;
  const displayAvatar = isChannel
    ? channelInfo?.avatar
    : otherParticipant?.avatar;
  const displayBio = isChannel
    ? channelInfo?.description
    : otherParticipant?.bio || 'Hey there! I am using TalkWave.';

  return (
    <div className="hidden lg:flex w-72 flex-col" style={{ backgroundColor: '#0b141a', borderLeft: '1px solid #202c33' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: '#202c33' }}>
        <h3 className="font-semibold text-white">
          {isChannel ? 'Channel Info' : 'Contact Info'}
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <>
            {/* Profile Section */}
            <div className="p-6 flex flex-col items-center border-b" style={{ borderColor: '#202c33' }}>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-24 h-24 rounded-full mb-3 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                  {getInitials(displayName)}
                </div>
              )}
              <h4 className="text-white font-semibold text-lg">{displayName || 'Unknown'}</h4>
              {!isChannel && otherParticipant?.username && (
                <p className="text-neutral-400 text-sm">@{otherParticipant.username}</p>
              )}
              {!isChannel && otherParticipant?.status && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${
                    otherParticipant.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-neutral-400 text-xs capitalize">{otherParticipant.status}</span>
                </div>
              )}
            </div>

            {/* About Section */}
            <div className="p-4 border-b" style={{ borderColor: '#202c33' }}>
              <p className="text-neutral-400 text-xs mb-2">
                {isChannel ? 'DESCRIPTION' : 'ABOUT'}
              </p>
              <p className="text-white text-sm">{displayBio}</p>
            </div>

            {/* Channel Members (if channel) */}
            {isChannel && channelInfo?.members && (
              <div className="p-4 border-b" style={{ borderColor: '#202c33' }}>
                <p className="text-neutral-400 text-xs mb-2">MEMBERS</p>
                <p className="text-white text-sm">{channelInfo.members.length} members</p>
              </div>
            )}

            {/* Email (if available) */}
            {!isChannel && otherParticipant?.email && (
              <div className="p-4 border-b" style={{ borderColor: '#202c33' }}>
                <p className="text-neutral-400 text-xs mb-2">EMAIL</p>
                <p className="text-white text-sm break-all">{otherParticipant.email}</p>
              </div>
            )}

            {/* Media Section */}
            <div className="p-4 border-b" style={{ borderColor: '#202c33' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-neutral-400 text-xs">MEDIA, LINKS & DOCS</p>
                <span className="text-teal-400 text-xs">{sharedMedia.length}</span>
              </div>
              {sharedMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.map((media, index) => (
                    <a
                      key={index}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square bg-neutral-800 rounded overflow-hidden hover:opacity-80 transition"
                    >
                      {media.resourceType === 'image' ? (
                        <img
                          src={media.url}
                          alt={media.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {media.resourceType === 'video' ? (
                            <FileText size={24} className="text-neutral-400" />
                          ) : (
                            <FileText size={24} className="text-neutral-400" />
                          )}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-neutral-500 text-xs">No media shared yet</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              {!isChannel && (
                <>
                  {showBlockConfirm ? (
                    <div className="bg-neutral-800 p-3 rounded-lg">
                      <p className="text-white text-sm mb-3">Block this contact?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleBlockContact}
                          className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                        >
                          Yes, Block
                        </button>
                        <button
                          onClick={() => setShowBlockConfirm(false)}
                          className="flex-1 py-2 px-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBlockConfirm(true)}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      <span>🚫</span>
                      Block Contact
                    </button>
                  )}
                </>
              )}

              {showDeleteConfirm ? (
                <div className="bg-neutral-800 p-3 rounded-lg">
                  <p className="text-white text-sm mb-3">
                    {isChannel ? 'Leave this channel?' : 'Clear this chat from view?'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteChat}
                      className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                    >
                      Yes, {isChannel ? 'Leave' : 'Clear'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 px-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  <span>🗑️</span>
                  {isChannel ? 'Leave Channel' : 'Clear Chat'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
