import React from 'react';
import { useSelector } from 'react-redux';
import Avatar from '../components/common/Avatar.jsx';

export const Profile = () => {
  const { user } = useSelector(state => state.auth);

  return (
    <div className="min-h-screen w-full bg-neutral-950 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="bg-surface border border-border rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-6">
            <Avatar src={user?.avatar} alt={user?.displayName} size="xl" />
            <div>
              <h2 className="text-2xl font-bold">{user?.displayName || user?.username}</h2>
              <p className="text-muted">@{user?.username}</p>
              <p className="text-sm text-muted mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <p className="text-muted">{user?.bio || 'No bio added yet'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <p className="text-xs font-mono text-muted">{user?._id}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <button className="px-6 py-2 bg-brand text-white rounded-lg hover:bg-opacity-90 transition">
              Edit Profile
            </button>
            <button className="px-6 py-2 border border-border rounded-lg hover:bg-surface2 transition">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
