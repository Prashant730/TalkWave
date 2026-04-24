import React from 'react';

export const Avatar = ({ src, alt = 'Avatar', size = 'md', onlineStatus = null, className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full rounded-full object-cover bg-surface2"
      />
      {onlineStatus && (
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
          onlineStatus === 'online' ? 'bg-green-500' :
          onlineStatus === 'away' ? 'bg-yellow-500' :
          'bg-gray-500'
        }`} />
      )}
    </div>
  );
};

export default Avatar;
