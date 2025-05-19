import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';

export default function SendUnitsPage() {
  const { user } = useContext(AuthContext);
  const cid = user.country;

  const [inventory, setInventory] = useState([]);
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({
    unitTypeId: '',
    quantity: 1,
    targetCountryId: ''
  });
  const [error, setError]       = useState('');
  const [message, setMessage]   = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [invRes, ctrRes] = await Promise.all([
          client.get(`/dashboard/${cid}/inventory`),
          client.get('/countries')
        ]);
        setInventory(invRes.data);
        // exclude own country
        setCountries(ctrRes.data.filter(c => c._id !== cid));
      } catch {
        setError('Failed to load inventory or countries');
      }
    }
    load();
  }, [cid]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post(`/dashboard/${cid}/send-unit`, form);
      setMessage('Units dispatched!');
    } catch (err) {
      setError(err.response?.data?.error || 'Send failed');
    }
  };

  return (
    <div className="bg-white shadow rounded p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Send Units</h2>
      {error   && <div className="text-red-600 mb-2">{error}</div>}
      {message && <div className="text-green-600 mb-2">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={form.unitTypeId}
          onChange={e => setForm({ ...form, unitTypeId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">— Select your units —</option>
          {inventory.map(u => (
            <option key={u.unitType} value={u.unitType}>
              {u.name} (You have {u.count})
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={e => setForm({ ...form, quantity: +e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Quantity"
          required
        />

        <select
          value={form.targetCountryId}
          onChange={e => setForm({ ...form, targetCountryId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">— Target country —</option>
          {countries.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="attack">Attack</option>
          <option value="spy">Spy</option>
          <option value="nuke">Nuke</option>
        </select>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Dispatch
        </button>
      </form>
    </div>
);
}
