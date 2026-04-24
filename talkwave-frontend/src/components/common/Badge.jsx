import React from 'react';

export const Badge = ({ count, className = '' }) => {
  if (count === 0 || count === null) return null;

  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default Badge;
