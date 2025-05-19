// client/src/components/BuildingManager.jsx

import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function BuildingManager() {
  const [builds, setBuilds]    = useState([]);
  const [countries, setCountries] = useState([]);
  const [form, setForm]        = useState({
    name: '',
    costCents: 0,
    landUsage: 0,
    moneyDeltaPerSecond: 0,
    oilDeltaPerSecond: 0,
    country: ''   // empty = global
  });
  const [error, setError]      = useState('');

  useEffect(() => {
    client.get('/admin/building-types').then(r => setBuilds(r.data));
    client.get('/countries').then(r => setCountries(r.data));
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/building-types', form);
      const { data } = await client.get('/admin/building-types');
      setBuilds(data);
      setForm({ name:'', costCents:0, landUsage:0, moneyDeltaPerSecond:0, oilDeltaPerSecond:0, country:'' });
    } catch {
      setError('Failed to save building');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Building Types</h3>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="mb-4 space-y-1">
        {builds.map(b => (
          <li key={b._id}>
            {b.name} — Cost:{b.costCents} — Land:{b.landUsage}  
            [{b.country || 'Global'}]
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />

        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            placeholder="Cost (¢)"
            value={form.costCents}
            onChange={e => setForm({ ...form, costCents: +e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Land Usage"
            value={form.landUsage}
            onChange={e => setForm({ ...form, landUsage: +e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Money Δ/sec (¢)"
            value={form.moneyDeltaPerSecond}
            onChange={e => setForm({ ...form, moneyDeltaPerSecond: +e.target.value })}
            className="border p-2 rounded"
            required
          />
        </div>

        <input
          type="number"
          placeholder="Oil Δ/sec"
          value={form.oilDeltaPerSecond}
          onChange={e => setForm({ ...form, oilDeltaPerSecond: +e.target.value })}
          className="border p-2 rounded"
          required
        />

        <select
          value={form.country}
          onChange={e => setForm({ ...form, country: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="">Global</option>
          {countries.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <button className="w-full px-4 py-2 bg-green-600 text-white rounded">
          Save Building
        </button>
      </form>
    </div>
);
}
