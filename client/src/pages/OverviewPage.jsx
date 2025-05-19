// client/src/pages/OverviewPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import client from '../api/client';

export default function OverviewPage() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [err, setErr]   = useState('');

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await client.get(`/dashboard/${user.country}/overview`);
        setData(res.data);
      } catch {
        setErr('Failed to load overview');
      }
    }
    if (user?.country) loadOverview();
  }, [user]);

  if (err) return <div className="text-red-600 p-4">{err}</div>;
  if (!data) return <div className="p-4">Loading overview…</div>;

  return (
    <div className="space-y-6">
      {/* Resources */}
      <section className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Resources</h2>
        <p>Money/sec: ${(data.resource.moneyCentsPerSecond / 100).toFixed(2)}</p>
        <p>Oil/sec: {data.resource.oilUnitsPerSecond}</p>
        <p>Land used: {data.usedLand} / {data.landLimit}</p>
      </section>

      {/* Pending Events */}
      <section className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Pending Events</h2>
        {data.pendingEvents.length === 0 ? (
          <p>No pending events.</p>
        ) : (
          <ul className="list-disc pl-5">
            {data.pendingEvents.map(ev => (
              <li key={ev._id}>
                {ev.type.toUpperCase()} arriving at{' '}
                {new Date(ev.arrivesAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
