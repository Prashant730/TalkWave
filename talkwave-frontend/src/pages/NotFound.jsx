import React from 'react';

export const NotFound = () => {
  return (
    <div className="flex items-center justify-center w-screen h-screen bg-neutral-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <a href="/chat" className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90">
          Back to Chat
        </a>
      </div>
    </div>
  );
};

export default NotFound;
