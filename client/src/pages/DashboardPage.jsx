import React, { useState, useEffect, useContext, useCallback } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';
import MapView from '../components/MapView';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const countryId = user?.country;
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [resource, setResource]     = useState(null);
  const [unitTypes, setUnitTypes]   = useState([]);
  const [pendingEvents, setPending] = useState([]);

  // form state
  const [purchase, setPurchase] = useState({
    unitTypeId: '',
    quantity: 1,
    targetCountryId: countryId,
    type: 'attack'
  });
  const [generator, setGenerator] = useState({
    costCents: 5000,
    moneyDelta: 50,
    oilDelta: 1
  });

  // Stable callback to load dashboard data
  const loadDashboard = useCallback(async () => {
    if (!countryId) return;
    setLoading(true);
    try {
      const { data } = await client.get(`/dashboard/${countryId}`);
      setResource(data.resource);
      setUnitTypes(data.unitTypes);
      setPending(data.pendingEvents);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [countryId]);

  // Effect triggers when loadDashboard changes (i.e. countryId changes)
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handlePurchase = async e => {
    e.preventDefault();
    try {
      await client.post(`/dashboard/${countryId}/buy-unit`, purchase);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Purchase failed');
    }
  };

  const handleBuild = async e => {
    e.preventDefault();
    try {
      await client.post(`/dashboard/${countryId}/build-generator`, {
        costCents: generator.costCents,
        moneyCentsPerSecondDelta: generator.moneyDelta,
        oilUnitsPerSecondDelta: generator.oilDelta
      });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Build failed');
    }
  };

  if (loading) return <div>Loading dashboard…</div>;
  if (error)   return <div className="text-red-600">{error}</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl">Dashboard — {countryId}</h2>

      {/* Resources */}
      <section className="border p-4 rounded">
        <h3 className="text-xl mb-2">Resources</h3>
        <p>Money rate: ${(resource.moneyCentsPerSecond / 100).toFixed(2)}/sec</p>
        <p>Oil rate: {resource.oilUnitsPerSecond} units/sec</p>
      </section>

      {/* Purchase Units */}
      <section className="border p-4 rounded">
        <h3 className="text-xl mb-2">Purchase Units</h3>
        <form onSubmit={handlePurchase} className="space-y-2">
          <select
            value={purchase.unitTypeId}
            onChange={e => setPurchase({ ...purchase, unitTypeId: e.target.value })}
            className="border p-2 w-full"
            required
          >
            <option value="">Select unit type</option>
            {unitTypes.map(u => (
              <option key={u._id} value={u._id}>
                {u.name} — Cost ${(u.costCents/100).toFixed(2)} — Atk {u.attack} Def {u.defense}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={purchase.quantity}
            onChange={e => setPurchase({ ...purchase, quantity: +e.target.value })}
            className="border p-2 w-full"
            placeholder="Quantity"
            required
          />

          <select
            value={purchase.targetCountryId}
            onChange={e => setPurchase({ ...purchase, targetCountryId: e.target.value })}
            className="border p-2 w-full"
          >
            <option value={countryId}>{countryId}</option>
          </select>

          <select
            value={purchase.type}
            onChange={e => setPurchase({ ...purchase, type: e.target.value })}
            className="border p-2 w-full"
          >
            <option value="attack">Attack</option>
            <option value="spy">Spy</option>
            <option value="nuke">Nuke</option>
          </select>

          <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">
            Send Units
          </button>
        </form>
      </section>

      {/* Build Generators */}
      <section className="border p-4 rounded">
        <h3 className="text-xl mb-2">Build Generator</h3>
        <form onSubmit={handleBuild} className="space-y-2">
          <input
            type="number"
            min="0"
            value={generator.costCents}
            onChange={e => setGenerator({ ...generator, costCents: +e.target.value })}
            className="border p-2 w-full"
            placeholder="Build Cost (¢)"
          />
          <input
            type="number"
            value={generator.moneyDelta}
            onChange={e => setGenerator({ ...generator, moneyDelta: +e.target.value })}
            className="border p-2 w-full"
            placeholder="Money Δ ¢/sec"
          />
          <input
            type="number"
            value={generator.oilDelta}
            onChange={e => setGenerator({ ...generator, oilDelta: +e.target.value })}
            className="border p-2 w-full"
            placeholder="Oil Δ units/sec"
          />
          <button type="submit" className="w-full p-2 bg-green-600 text-white rounded">
            Build
          </button>
        </form>
      </section>

      {/* Pending Events */}
      <section className="border p-4 rounded">
      <h3 className="text-xl mb-2">Map & Pending Events</h3>
        <MapView
          countryId={countryId}
          pendingEvents={pendingEvents}
        />
        {pendingEvents.length === 0 ? (
          <p>No pending actions.</p>
        ) : (
          <ul className="space-y-2">
            {pendingEvents.map(ev => (
              <li key={ev._id} className="p-2 bg-gray-100 rounded">
                {ev.type.toUpperCase()} → Arrives at {new Date(ev.arrivesAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
