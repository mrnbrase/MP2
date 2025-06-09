// client/src/pages/OverviewPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import client from '../api/client';
import BuyUnitsPage from './BuyUnitsPage';
import SendUnitsPage from './SendUnitsPage';
import BuildPage from './BuildPage';
import Modal from '../components/Modal';

export default function OverviewPage() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [resource, setResource] = useState(null);
  const [err, setErr]   = useState('');
  const [showBuy,  setShowBuy]  = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showBuild,setShowBuild]= useState(false);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await client.get(`/dashboard/${user.country}/overview`);
        setData(res.data);
        setResource(res.data.resource);
      } catch {
        setErr('Failed to load overview');
      }
    }
    if (user?.country) loadOverview();
  }, [user]);

  useEffect(() => {
    if (!resource) return;
    const id = setInterval(() => {
      setResource(r => ({
        ...r,
        moneyCents: r.moneyCents + r.moneyCentsPerSecond,
        oilUnits:   r.oilUnits + r.oilUnitsPerSecond
      }));
    }, 1000);
    return () => clearInterval(id);
  }, [resource]);

  if (err) return <div className="text-red-600 p-4">{err}</div>;
  if (!data || !resource) return <div className="p-4">Loading overview…</div>;

  return (
    <div className="space-y-6">
      {/* Resources */}
      <section className="bg-white shadow rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Resources</h2>
        <p>Money: ${(resource.moneyCents / 100).toFixed(2)}</p>
        <p>Oil: {resource.oilUnits.toFixed(0)}</p>
        <p className="text-sm text-gray-600">
          +{(resource.moneyCentsPerSecond / 100).toFixed(2)}/sec,
          +{resource.oilUnitsPerSecond}/sec
        </p>
        <p>Land used: {data.usedLand} / {data.landLimit}</p>
        <div className="mt-4 space-x-2">
          <button className="button" onClick={() => setShowBuy(true)}>Buy Units</button>
          <button className="button" onClick={() => setShowSend(true)}>Send Units</button>
          <button className="button" onClick={() => setShowBuild(true)}>Build</button>
        </div>
      </section>

      <Modal open={showBuy} onClose={() => setShowBuy(false)}>
        <BuyUnitsPage />
      </Modal>
      <Modal open={showSend} onClose={() => setShowSend(false)}>
        <SendUnitsPage />
      </Modal>
      <Modal open={showBuild} onClose={() => setShowBuild(false)}>
        <BuildPage />
      </Modal>

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
