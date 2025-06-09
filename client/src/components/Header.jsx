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
    <header className="header">
      <nav>
        <Link to="/election">Election</Link>
        <Link to="/dashboard">Dashboard</Link>
        {user?.role === 'admin' && (
          <Link to="/admin">Admin</Link>
        )}
      </nav>
      <button onClick={handleLogout} className="button logout-button">
        Logout
      </button>
    </header>
  );
}
