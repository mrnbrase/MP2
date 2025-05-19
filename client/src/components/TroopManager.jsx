// client/src/components/TroopManager.jsx

import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function TroopManager() {
  const [units, setUnits]       = useState([]);
  const [countries, setCountries] = useState([]);
  const [form, setForm]         = useState({
    name: '',
    costCents: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    hp: 0,
    country: ''   // empty = global
  });
  const [error, setError]       = useState('');

  useEffect(() => {
    // load existing unit types
    client.get('/admin/unit-types').then(r => setUnits(r.data));
    // load countries for the dropdown
    client.get('/countries').then(r => setCountries(r.data));
  }, []);

  const submit = async e => {
    e.preventDefault();
    setError('');
    try {
      // send form.country ('' becomes null server‐side)
      await client.post('/admin/unit-types', form);
      // refresh list
      const { data } = await client.get('/admin/unit-types');
      setUnits(data);
      setForm({ name:'', costCents:0, attack:0, defense:0, speed:0, hp:0, country:'' });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save troop');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Troop Types</h3>
      {error && <p className="text-red-600">{error}</p>}
      <ul className="mb-4 space-y-1">
        {units.map(u => (
          <li key={u._id}>
            {u.name} — Cost:{u.costCents} — Atk:{u.attack} Def:{u.defense}  
            [{u.country || 'Global'}]
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
            placeholder="Attack"
            value={form.attack}
            onChange={e => setForm({ ...form, attack: +e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Defense"
            value={form.defense}
            onChange={e => setForm({ ...form, defense: +e.target.value })}
            className="border p-2 rounded"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Speed"
            value={form.speed}
            onChange={e => setForm({ ...form, speed: +e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="HP"
            value={form.hp}
            onChange={e => setForm({ ...form, hp: +e.target.value })}
            className="border p-2 rounded"
            required
          />
        </div>

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

        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded">
          Save Troop
        </button>
      </form>
    </div>
);
}
