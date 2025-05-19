import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loadingAuth } = useContext(AuthContext);

  // 1) Still checking token & profile? Show nothing or a spinner.
  if (loadingAuth) return <div>Loading...</div>;

  // 2) Not authenticated? Redirect to login.
  if (!user) return <Navigate to="/login" replace />;

  // 3) Authenticated! Render the protected page.
  return children;
}
