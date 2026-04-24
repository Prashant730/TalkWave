import React from 'react';
import Avatar from '../Avatar';

const TypingIndicator = ({ typingUsers, userMap = {} }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const uniqueTypingUsers = [...new Set(typingUsers)];
  const displayNames = uniqueTypingUsers
    .slice(0, 2)
    .map((userId) => userMap[userId]?.displayName || 'Someone')
    .join(', ');

  const suffix =
    uniqueTypingUsers.length > 2
      ? `and ${uniqueTypingUsers.length - 2} more are typing...`
      : uniqueTypingUsers.length === 1
      ? 'is typing...'
      : 'are typing...';

  return (
    <div className="px-4 py-2 flex items-center gap-2 text-sm text-muted">
      <div className="flex gap-1 items-center">
        <span className="inline-block w-2 h-2 bg-brand rounded-full animate-bounce"></span>
        <span className="inline-block w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
        <span className="inline-block w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
      </div>
      <span>
        {displayNames} {suffix}
      </span>
    </div>
  );
};

export default TypingIndicator;
