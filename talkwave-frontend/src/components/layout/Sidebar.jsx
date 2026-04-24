import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setConversations, setActiveConversation } from '../../store/chatSlice';
import { setChannels, setActiveChannel } from '../../store/channelSlice';
import Avatar from '../Avatar';
import axios from '../../api/axios';
import { formatRelativeTime } from '../../utils/formatTime';
import { MessageCircle, Hash, PlusCircle } from 'lucide-react';
import { NewChatModal } from '../modals/NewChatModal';
import { useSocket } from '../../hooks/useSocket';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { conversations, activeConversationId } = useSelector((state) => state.chat);
  const { channels, activeChannelId } = useSelector((state) => state.channel);
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('conversations');
  const [isNewChatModalOpen, setNewChatModalOpen] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get('/v1/conversations');
        dispatch(setConversations(response.data.data));
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();
  }, [dispatch]);

  // Fetch channels on mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get('/v1/channels');
        dispatch(setChannels(response.data.data));
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    };

    fetchChannels();
  }, [dispatch]);

  // Listen for real-time conversation updates
  useEffect(() => {
    if (!socket) return;

    // When a message is received, update the conversation's lastMessage
    socket.on('message:receive', (message) => {
      if (message.conversationId) {
        dispatch(setConversations(
          conversations.map(conv =>
            conv._id === message.conversationId
              ? {
                  ...conv,
                  lastMessage: message,
                  lastActivityAt: new Date().toISOString()
                }
              : conv
          ).sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt))
        ));
      }
    });

    return () => {
      socket.off('message:receive');
    };
  }, [socket, conversations, dispatch]);

  const handleNewChat = async (selectedUser) => {
    setNewChatModalOpen(false);
    try {
      const response = await axios.post('/v1/conversations', { userId: selectedUser._id });
      const newConversation = response.data.data;
      // Avoid adding duplicates
      if (!conversations.some(c => c._id === newConversation._id)) {
        dispatch(setConversations([newConversation, ...conversations]));
      }
      dispatch(setActiveConversation(newConversation._id));

      // Join Socket.IO room immediately
      if (socket) {
        socket.emit('join:room', `conv_${newConversation._id}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleConversationClick = (conversation) => {
    dispatch(setActiveConversation(conversation._id));
    setActiveTab('conversations');
  };

  const handleChannelClick = (channel) => {
    dispatch(setActiveChannel(channel));
    setActiveTab('channels');
  };

  return (
    <div className="w-64 bg-surface border-r border-border h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent">
          TalkWave
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
            activeTab === 'conversations'
              ? 'border-b-2 border-brand text-brand'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <MessageCircle size={16} />
          Direct
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex-1 px-4 py-3 font-medium flex items-center justify-center gap-2 transition ${
            activeTab === 'channels'
              ? 'border-b-2 border-brand text-brand'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <Hash size={16} />
          Channels
        </button>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'conversations' ? (
          // Conversations List
          <>
            <div className="p-2">
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-sm text-muted hover:bg-surface2 hover:text-foreground transition"
              >
                <PlusCircle size={16} />
                New Conversation
              </button>
            </div>
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-muted text-sm">
                <p>No conversations yet</p>
                <p className="text-xs mt-2">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => {
                  const otherParticipant = conversation.otherParticipant;

                  return (
                    <button
                      key={conversation._id}
                      onClick={() => handleConversationClick(conversation)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition ${
                        activeConversationId === conversation._id
                          ? 'bg-brand bg-opacity-20 border border-brand'
                          : 'hover:bg-surface2'
                      }`}
                    >
                      <Avatar
                        src={otherParticipant?.avatar}
                        name={otherParticipant?.displayName}
                        size="sm"
                      />

                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-semibold text-sm truncate">
                          {otherParticipant?.displayName}
                        </h3>
                        <p className="text-xs text-muted truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>

                      {conversation.lastActivityAt && (
                        <span className="text-xs text-muted flex-shrink-0">
                          {formatRelativeTime(new Date(conversation.lastActivityAt))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // Channels List
          channels.length === 0 ? (
            <div className="p-4 text-center text-muted text-sm">
              <p>No channels yet</p>
              <p className="text-xs mt-2">Create or join a channel to begin</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {channels.map((channel) => (
                <button
                  key={channel._id}
                  onClick={() => handleChannelClick(channel)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition ${
                    activeChannelId === channel._id
                      ? 'bg-brand bg-opacity-20 border border-brand'
                      : 'hover:bg-surface2'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <Hash size={20} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-sm truncate">
                      {channel.name}
                    </h3>
                    <p className="text-xs text-muted truncate">
                      {channel.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {channel.lastMessageAt && (
                    <span className="text-xs text-muted flex-shrink-0">
                      {formatRelativeTime(new Date(channel.lastMessageAt))}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border flex items-center gap-3 flex-shrink-0">
        <Avatar src={user?.avatar} name={user?.displayName} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{user?.displayName}</h4>
          <p className="text-xs text-muted truncate">@{user?.username}</p>
        </div>
        {/* Add logout/settings button here if needed */}
      </div>

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onRequestClose={() => setNewChatModalOpen(false)}
        onUserSelect={handleNewChat}
      />
    </div>
  );
};

export default Sidebar;
