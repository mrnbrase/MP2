import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';

export default function BuildPage() {
  const { user } = useContext(AuthContext);
  const countryId = user.country;

  const [types, setTypes]   = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm]     = useState({ buildingTypeId:'', cityId:'' });
  const [error, setError]   = useState('');
  const [msg, setMsg]       = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [btRes, cityRes] = await Promise.all([
          client.get(`/dashboard/${countryId}/building-types`),
          client.get(`/admin/cities`) // reuse admin endpoint
        ]);
        // filter cities for this country
        setTypes(btRes.data);
        setCities(cityRes.data.filter(c => c.country._id === countryId));
      } catch {
        setError('Failed to load build data');
      }
    }
    if (countryId) load();
  }, [countryId]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await client.post(`/dashboard/${countryId}/build`, {
        buildingTypeId: form.buildingTypeId,
        cityId: form.cityId
      });
      setMsg('Build order placed!');
    } catch (err) {
      setError(err.response?.data?.error || 'Build failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow rounded p-6">
      <h2 className="text-2xl mb-4">Build Structures</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {msg   && <div className="text-green-600 mb-2">{msg}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={form.buildingTypeId}
          onChange={e => setForm({ ...form, buildingTypeId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select Building</option>
          {types.map(b => (
            <option key={b._id} value={b._id}>
              {b.name} — Cost ${(b.costCents/100).toFixed(2)} — land:{b.landUsage}
            </option>
          ))}
        </select>

        <select
          value={form.cityId}
          onChange={e => setForm({ ...form, cityId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select City</option>
          {cities.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Build
        </button>
      </form>
    </div>
  );
}
