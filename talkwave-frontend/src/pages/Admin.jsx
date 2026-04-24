import React from 'react';
import { useSelector } from 'react-redux';

export const Admin = () => {
  const { user } = useSelector(state => state.auth);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="text-muted mt-2">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: '0' },
            { label: 'Active Users', value: '0' },
            { label: 'Messages Today', value: '0' },
            { label: 'Total Channels', value: '0' }
          ].map((stat, i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-6">
              <p className="text-muted text-sm">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Users Management</h2>
            <p className="text-muted">User management interface coming soon...</p>
          </div>

          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Reports</h2>
            <p className="text-muted">Reports interface coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
