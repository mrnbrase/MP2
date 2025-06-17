import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';
import toast from 'react-hot-toast'; // Import toast

export default function BuyUnitsPage() {
  const { user } = useContext(AuthContext);
  const countryId = user.country;

  const [units, setUnits] = useState([]);
  const [form, setForm]   = useState({
    unitTypeId: '',
    quantity: 1
  });
  // Error and message states can be removed if fully replaced by toasts
  // const [error, setError] = useState('');
  // const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadUnitTypes() {
      try {
        const res = await client.get(`/dashboard/${countryId}/unit-types`);
        setUnits(res.data);
      } catch (e) {
        console.error(e);
        toast.error(e.response?.data?.error || 'Failed to load unit types');
      }
    }
    if (countryId) loadUnitTypes();
  }, [countryId]);

  const handleSubmit = async e => {
    e.preventDefault();
    // setError(''); // No longer needed
    // setMessage(''); // No longer needed
    if (!form.unitTypeId) {
      toast.error('Please select a unit type.');
      return;
    }
    try {
      await client.post(`/dashboard/${countryId}/buy-unit`, form);
      toast.success('Units purchased successfully!');
      // Optionally reset form or update other state here
      setForm({ unitTypeId: '', quantity: 1 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    }
  };

  return (
    <div className="bg-white shadow rounded p-6">
      <h2 className="text-2xl font-semibold mb-4">Buy Units</h2>
      {/* Error and message divs can be removed */}
      {/* {error && <div className="text-red-600 mb-2">{error}</div>} */}
      {/* {message && <div className="text-green-600 mb-2">{message}</div>} */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          value={form.unitTypeId}
          onChange={e => setForm({ ...form, unitTypeId: e.target.value })}
          className="w-full p-2 border rounded"
          // Making it not required so custom toast can handle it if empty
          // required
        >
          <option value="">Select a unit</option>
          {units.map(u => (
            <option key={u._id} value={u._id}>
              {u.name} – ${(u.costCents / 100).toFixed(2)} – Atk {u.attack} Def {u.defense}
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

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Purchase
        </button>
      </form>
    </div>
  );
}
