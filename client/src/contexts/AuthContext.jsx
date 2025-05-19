import React, { createContext, useState, useEffect } from 'react';
import client from '../api/client';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // On mount, check for saved token & fetch profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingAuth(false);
      return;
    }
    client.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoadingAuth(false);
      });
  }, []);

  const signup = async (email, password, country) => {
    const { data } = await client.post('/auth/signup', { email, password, country });
    localStorage.setItem('token', data.token);
    const me = await client.get('/auth/me');
    setUser(me.data);
  };

  const login = async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    const me = await client.get('/auth/me');
    setUser(me.data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loadingAuth, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
