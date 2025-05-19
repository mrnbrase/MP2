import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';

export default function StatsPage() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await client.get(`/dashboard/${user.country}`);
        setStats(data);
      } catch {
        setError('Failed to load country stats');
      }
    }
    if (user?.country) loadStats();
  }, [user]);

  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!stats) return <div className="p-4">Loading stats…</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl">Stats for {stats.countryName}</h2>

      {/* Resources */}
      <section className="bg-white shadow rounded p-4">
        <h3 className="text-xl mb-2">Resources</h3>
        <p>Money/sec: ${(stats.resource.moneyCentsPerSecond/100).toFixed(2)}</p>
        <p>Oil/sec: {stats.resource.oilUnitsPerSecond}</p>
      </section>

      {/* Pending Events */}
      <section className="bg-white shadow rounded p-4">
        <h3 className="text-xl mb-2">Pending Actions</h3>
        {stats.pendingEvents.length === 0 ? (
          <p>No pending actions.</p>
        ) : (
          <ul className="list-disc pl-5">
            {stats.pendingEvents.map(ev => (
              <li key={ev._id}>
                {ev.type.toUpperCase()} → Arrives at{' '}
                {new Date(ev.arrivesAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
