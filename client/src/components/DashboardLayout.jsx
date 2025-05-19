import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <nav className="flex space-x-4 mb-6 border-b">
          {[
            { to: '',    label: 'Overview' },
            { to: 'buy', label: 'Buy Units' },
            { to: 'send',label: 'Send Units' },
            { to: 'build',label:'Build' },
          ].map(tab => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                `px-4 py-2 ${isActive ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* Render the selected page */}
        <Outlet />
      </div>
    </div>
  );
}
