import React from 'react';
import SidebarNew from '../components/layout/SidebarNew.jsx';
import ChatAreaNew from '../components/layout/ChatAreaNew.jsx';
import InfoPanel from '../components/layout/InfoPanel.jsx';

export const Chat = () => {
  return (
    <div className="flex w-screen h-screen bg-neutral-950 overflow-hidden">
      <React.Suspense fallback={<div className="flex-1 bg-neutral-950 flex items-center justify-center text-white">Loading sidebar...</div>}>
        <SidebarNew />
      </React.Suspense>
      <React.Suspense fallback={<div className="flex-1 bg-neutral-950 flex items-center justify-center text-white">Loading chat...</div>}>
        <ChatAreaNew />
      </React.Suspense>
      <React.Suspense fallback={<div className="hidden lg:flex w-72 bg-neutral-900 items-center justify-center text-white">Loading...</div>}>
        <InfoPanel />
      </React.Suspense>
    </div>
  );
};

export default Chat;
