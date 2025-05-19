import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      <nav className="space-x-4">
        <Link to="/election" className="hover:underline">Election</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className="hover:underline">Admin</Link>
        )}
      </nav>
      <button
        onClick={handleLogout}
        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
      >
        Logout
      </button>
    </header>
  );
}
