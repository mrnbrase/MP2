// client/src/pages/CountrySelect.jsx

import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CountrySelect() {
  const { user, setUser, logout } = useContext(AuthContext);
  const [countries, setCountries] = useState([]);
  const [selected,  setSelected]  = useState('');
  const [error,     setError]     = useState('');
  const navigate = useNavigate();

  // On mount: if they already picked a country, route them correctly
  useEffect(() => {
    async function checkLock() {
      if (!user?.country) return;
      // 1) If they're already the president, send to dashboard
      if (user.role === 'president') {
        navigate('/dashboard', { replace: true });
        return;
      }
      // 2) Otherwise see if an election is open
      try {
        const { data: elect } = await client.get('/elections/current');
        if (elect) {
          navigate('/election', { replace: true });
        } else {
          navigate('/stats', { replace: true });
        }
      } catch {
        // ignore
      }
    }
    checkLock();
  }, [user, navigate]);

  // Load country list
  useEffect(() => {
    client.get('/countries')
      .then(res => setCountries(res.data))
      .catch(() => setError('Failed to load countries'));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!selected) {
      setError('Please select a country');
      return;
    }
    try {
      const { data: updated } = await client.patch('/auth/me', { country: selected });
      setUser(updated);

      // And *then* route them:
      if (updated.role === 'president') {
        navigate('/dashboard');
      } else {
        const { data: elect } = await client.get('/elections/current');
        if (elect) navigate('/election');
        else       navigate('/stats');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save country');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Select Your Country</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">— choose —</option>
          {countries.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </form>
      <button
        onClick={logout}
        className="mt-4 text-sm text-gray-600 underline"
      >
        Log out
      </button>
    </div>
  );
}
