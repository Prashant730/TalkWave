import React from 'react';

const Avatar = ({ src, name, size = 'md', status = null }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  const statusDotClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
  ];

  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length;

  const statusColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500',
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center font-semibold text-white`}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <div
          className={`absolute bottom-0 right-0 ${statusDotClasses[size]} ${statusColor[status]} rounded-full border-2 border-surface`}
        />
      )}
    </div>
  );
};

export default Avatar;
