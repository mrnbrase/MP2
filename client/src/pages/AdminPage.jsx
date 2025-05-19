// client/src/pages/AdminPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';
import TroopManager from '../components/TroopManager';
import BuildingManager from '../components/BuildingManager';

export default function AdminPage() {
  const { user, logout } = useContext(AuthContext);

  const [seedMsg, setSeedMsg]               = useState('');
  const [error, setError]                   = useState('');
  const [countries, setCountries]           = useState([]);
  const [newCountryName, setNewCountryName] = useState('');
  const [newGeoJSON, setNewGeoJSON]         = useState('');
  const [users, setUsers]                   = useState([]);
  const [elections, setElections]           = useState([]);
  const [electionsLoading, setElectionsLoading] = useState(true);

  const [cities, setCities] = useState([]);
  const [newCity, setNewCity] = useState({
    name: '',
    lat: '',
    lng: '',
    country: ''    // <-- now track which country
  });

  // 1) Seed unit-types & resources
  const handleSeed = async () => {
    try {
      setError('');
      const { data } = await client.post('/admin/seed');
      setSeedMsg(`Seeded ${data.unitCount} unit-types for ${data.countryCount} countries.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Seeding failed');
    }
  };

  // 2) Load countries, users, open elections, and existing cities
  useEffect(() => {
    async function loadAll() {
      try {
        setError('');
        setElectionsLoading(true);

        const [cRes, uRes, eRes, cityRes] = await Promise.all([
          client.get('/countries'),
          client.get(`/users?country=${user.country}`),
          client.get('/elections/open'),
          client.get('/admin/cities')
        ]);

        setCountries(cRes.data);
        setUsers(uRes.data);
        setElections(eRes.data);
        setCities(cityRes.data);
      } catch {
        setError('Failed to load admin data');
      } finally {
        setElectionsLoading(false);
      }
    }
    loadAll();
  }, [user.country]);

  // 2.1) Add a new city
  const handleAddCity = async e => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        name: newCity.name,
        lat:  parseFloat(newCity.lat),
        lng:  parseFloat(newCity.lng),
        country: newCity.country
      };
      const { data } = await client.post('/admin/cities', payload);
      setCities([...cities, data]);
      setNewCity({ name: '', lat: '', lng: '', country: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Add city failed');
    }
  };

  // 3) Add a new country
  const handleAddCountry = async e => {
    e.preventDefault();
    try {
      setError('');
      const geo = JSON.parse(newGeoJSON);
      await client.post('/countries', {
        name: newCountryName,
        geojson: geo
      });
      setNewCountryName('');
      setNewGeoJSON('');
      const { data } = await client.get('/countries');
      setCountries(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Add country failed');
    }
  };

  // 4) Ban a user
  const handleBan = async userId => {
    try {
      setError('');
      await client.post(`/admin/ban/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch {
      setError('Ban failed');
    }
  };

  // 5) Close an election manually
  const closeElection = async electionId => {
    try {
      setError('');
      await client.post(`/admin/elections/close/${electionId}`);
      setElections(elections.filter(e => e._id !== electionId));
    } catch {
      setError('Failed to close election');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {error && <div className="text-red-600">{error}</div>}

        {/* Seed Data */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Seed Data</h2>
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run Seed
          </button>
          {seedMsg && <p className="mt-2 text-green-600">{seedMsg}</p>}
        </section>

        {/* Add Country */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Country</h2>
          <form onSubmit={handleAddCountry} className="space-y-4">
            <input
              type="text"
              value={newCountryName}
              onChange={e => setNewCountryName(e.target.value)}
              placeholder="Country Code (e.g. SA)"
              className="w-full p-2 border rounded"
              required
            />
            <textarea
              value={newGeoJSON}
              onChange={e => setNewGeoJSON(e.target.value)}
              placeholder="GeoJSON (paste full JSON here)"
              className="w-full p-2 border rounded h-32"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Country
            </button>
          </form>
        </section>

        {/* Manage Users */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Users in {user.country}
          </h2>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            <ul className="space-y-2">
              {users.map(u => (
                <li
                  key={u._id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span>
                    {u.email}{' '}
                    <span className="text-sm text-gray-500">({u.role})</span>
                  </span>
                  <button
                    onClick={() => handleBan(u._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Ban
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Close Elections */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Close Elections</h2>
          {electionsLoading ? (
            <p>Loading elections…</p>
          ) : elections.length === 0 ? (
            <p>No open elections.</p>
          ) : (
            <ul className="space-y-2">
              {elections.map(e => (
                <li
                  key={e._id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <span>
                    {e.country.name} — Week of{' '}
                    {new Date(e.weekStart).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => closeElection(e._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Close Now
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Manage Cities */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Manage Cities</h2>
          <ul className="mb-4 space-y-2">
            {cities.map(c => (
              <li key={c._id} className="flex justify-between">
                <span>
                  {c.name} — <em>{c.country.name}</em> (
                  {c.location.lat.toFixed(4)}, {c.location.lng.toFixed(4)})
                </span>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddCity} className="space-y-4">
            <input
              value={newCity.name}
              onChange={e => setNewCity({ ...newCity, name: e.target.value })}
              placeholder="City Name"
              className="w-full p-2 border rounded"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={newCity.lat}
                onChange={e => setNewCity({ ...newCity, lat: e.target.value })}
                placeholder="Latitude"
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                step="any"
                value={newCity.lng}
                onChange={e => setNewCity({ ...newCity, lng: e.target.value })}
                placeholder="Longitude"
                className="border p-2 rounded"
                required
              />
            </div>

            <select
              value={newCity.country}
              onChange={e => setNewCity({ ...newCity, country: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">— Select Country —</option>
              {countries.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Add City
            </button>
          </form>
        </section>

        {/* Manage Troop Types */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Troop Types</h2>
          <TroopManager />
        </section>

        {/* Manage Building Types */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Building Types</h2>
          <BuildingManager />
        </section>

        {/* Logout */}
        <button
          onClick={logout}
          className="mt-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
