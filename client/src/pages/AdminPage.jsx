// client/src/pages/AdminPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';
import TroopManager from '../components/TroopManager';
import BuildingManager from '../components/BuildingManager';
import toast from 'react-hot-toast'; // Import toast

export default function AdminPage() {
  const { user, logout } = useContext(AuthContext);

  // const [seedMsg, setSeedMsg]               = useState(''); // Replaced by toast
  // const [error, setError]                   = useState(''); // Replaced by toast
  const [countries, setCountries]           = useState([]); // Keep for dropdowns
  const [newCountryName, setNewCountryName] = useState(''); // For add country form
  const [newGeoJSON, setNewGeoJSON]         = useState(''); // For add country form
  const [users, setUsers]                   = useState([]); // Keep for display
  const [elections, setElections]           = useState([]); // Keep for display
  const [electionsLoading, setElectionsLoading] = useState(true); // Keep for loading indicator

  const [cities, setCities] = useState([]); // Keep for display and dropdowns
  const [cityForm, setCityForm] = useState({
    _id: null,
    name: '',
    lat: '',
    lng: '',
    country: ''
  });
  const [isEditingCity, setIsEditingCity] = useState(false);

  // 1) Seed unit-types & resources
  const handleSeed = async () => {
    try {
      // setError(''); // Not needed
      const { data } = await client.post('/admin/seed');
      toast.success(`Seeded ${data.unitCount} unit-types for ${data.countryCount} countries.`);
      // setSeedMsg(`Seeded ${data.unitCount} unit-types for ${data.countryCount} countries.`); // Not needed
    } catch (err) {
      toast.error(err.response?.data?.error || 'Seeding failed');
      // setError(err.response?.data?.error || 'Seeding failed'); // Not needed
    }
  };

  // 2) Load countries, users, open elections, and existing cities
  useEffect(() => {
    async function loadAll() {
      try {
        // setError(''); // Not needed
        setElectionsLoading(true);

        const [cRes, uRes, eRes, cityRes] = await Promise.all([
          client.get('/countries'),
          client.get(`/users?country=${user.country}`), // This might need error handling if user.country is not set
          client.get('/elections/open'),
          client.get('/admin/cities')
        ]);

        setCountries(cRes.data);
        setUsers(uRes.data);
        setElections(eRes.data);
        setCities(cityRes.data);
      } catch (err) { // Catching a general error from Promise.all
        console.error("Error loading admin data:", err)
        toast.error('Failed to load some admin data. Check console for details.');
        // setError('Failed to load admin data'); // Not needed
      } finally {
        setElectionsLoading(false);
      }
    }
    if(user?.country) { // Ensure user.country exists before trying to load data dependent on it
        loadAll();
    } else {
        // Handle case where user.country might not be available yet, or provide a message
        // For now, just prevent loadAll if user.country is missing.
        // Alternatively, some data like all countries and cities (if not filtered by user's country) can be loaded.
        setElectionsLoading(false); // Ensure loading is false if we don't proceed
    }
  }, [user]); // user object as dependency

  // 2.1) Add or Update a city
  const handleSaveCity = async e => {
    e.preventDefault();
    if (!cityForm.name || !cityForm.lat || !cityForm.lng || !cityForm.country) {
        toast.error("All city fields are required.");
        return;
    }
    try {
      // setError(''); // Not needed
      const payload = {
        name: cityForm.name,
        lat:  parseFloat(cityForm.lat),
        lng:  parseFloat(cityForm.lng),
        country: cityForm.country
      };

      if (isEditingCity && cityForm._id) {
        const { data } = await client.put(`/admin/cities/${cityForm._id}`, payload);
        setCities(cities.map(c => c._id === cityForm._id ? data : c));
        toast.success(`City "${data.name}" updated successfully.`);
        setIsEditingCity(false);
      } else {
        const { data } = await client.post('/admin/cities', payload);
        setCities([...cities, data]);
        toast.success(`City "${data.name}" added successfully.`);
      }
      setCityForm({ _id: null, name: '', lat: '', lng: '', country: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || (isEditingCity ? 'Update city failed' : 'Add city failed'));
      // setError(err.response?.data?.error || (isEditingCity ? 'Update city failed' : 'Add city failed')); // Not needed
    }
  };

  const handleEditCity = (city) => {
    setIsEditingCity(true);
    setCityForm({
      _id: city._id,
      name: city.name,
      lat: city.location.lat,
      lng: city.location.lng,
      country: city.country?._id || city.country // Handle if country is just ID or populated
    });
  };

  const handleDeleteCity = async (cityId) => {
    if (window.confirm('Are you sure you want to delete this city?')) {
      try {
        // setError(''); // Not needed
        await client.delete(`/admin/cities/${cityId}`);
        setCities(cities.filter(c => c._id !== cityId));
        toast.success('City deleted successfully.');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Delete city failed');
        // setError(err.response?.data?.error || 'Delete city failed'); // Not needed
      }
    }
  };

  const cancelEditCity = () => {
    setIsEditingCity(false);
    setCityForm({ _id: null, name: '', lat: '', lng: '', country: '' });
  };

  // 3) Add a new country
  const handleAddCountry = async e => {
    e.preventDefault();
    if (!newCountryName || !newGeoJSON) {
        toast.error("Country name and GeoJSON are required.");
        return;
    }
    try {
      // setError(''); // Not needed
      const geo = JSON.parse(newGeoJSON); // This can throw error if newGeoJSON is not valid JSON
      await client.post('/countries', {
        name: newCountryName,
        geojson: geo
      });
      toast.success(`Country "${newCountryName}" added successfully.`);
      setNewCountryName('');
      setNewGeoJSON('');
      const { data } = await client.get('/countries'); // Refresh countries list
      setCountries(data);
    } catch (err) {
      // Check if error is from JSON.parse or API
      if (err instanceof SyntaxError) {
        toast.error('Invalid GeoJSON format.');
      } else {
        toast.error(err.response?.data?.error || 'Add country failed');
      }
      // setError(err.response?.data?.error || 'Add country failed'); // Not needed
    }
  };

  // 4) Ban a user
  const handleBan = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to ban user ${userEmail || userId}?`)) {
      try {
        // setError(''); // Not needed
        await client.post(`/admin/ban/${userId}`);
        setUsers(users.filter(u => u._id !== userId));
        toast.success(`User ${userEmail || userId} banned successfully.`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Ban failed');
        // setError('Ban failed'); // Not needed
      }
    }
  };

  // 5) Close an election manually
  const closeElection = async (electionId, electionName) => {
     if (window.confirm(`Are you sure you want to close the election for ${electionName}?`)) {
      try {
        // setError(''); // Not needed
        const {data: closeData} = await client.post(`/admin/elections/close/${electionId}`);
        setElections(elections.filter(e => e._id !== electionId));
        toast.success(`Election for ${electionName} closed. Winner determined (if any). Details: ${closeData.message}`);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to close election');
        // setError('Failed to close election'); // Not needed
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        {/* {error && <div className="text-red-600">{error}</div>} */} {/* Replaced by toast */}

        {/* Seed Data */}
        <section className="bg-white shadow rounded p-6">
          <h2 className="text-2xl font-semibold mb-4">Seed Data</h2>
          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run Seed
          </button>
          {/* {seedMsg && <p className="mt-2 text-green-600">{seedMsg}</p>} */} {/* Replaced by toast */}
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
            Users in {countries.find(c => c._id === user.country)?.name || 'your country'}
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
                    onClick={() => handleBan(u._id, u.email)}
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
              <li key={c._id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <span>{c.name} — <em>{c.country?.name || 'N/A'}</em></span>
                  <span className="text-xs text-gray-500 block">
                    Lat: {c.location.lat.toFixed(4)}, Lng: {c.location.lng.toFixed(4)}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => handleEditCity(c)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCity(c._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="text-xl font-semibold mb-3">{isEditingCity ? 'Edit City' : 'Add New City'}</h3>
          <form onSubmit={handleSaveCity} className="space-y-4 p-4 border rounded bg-gray-50">
            <input
              value={cityForm.name}
              onChange={e => setCityForm({ ...cityForm, name: e.target.value })}
              placeholder="City Name"
              className="w-full p-2 border rounded"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                value={cityForm.lat}
                onChange={e => setCityForm({ ...cityForm, lat: e.target.value })}
                placeholder="Latitude"
                className="border p-2 rounded"
                required
              />
              <input
                type="number"
                step="any"
                value={cityForm.lng}
                onChange={e => setCityForm({ ...cityForm, lng: e.target.value })}
                placeholder="Longitude"
                className="border p-2 rounded"
                required
              />
            </div>

            <select
              value={cityForm.country}
              onChange={e => setCityForm({ ...cityForm, country: e.target.value })}
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

            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-grow px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {isEditingCity ? 'Update City' : 'Add City'}
              </button>
              {isEditingCity && (
                <button
                  type="button"
                  onClick={cancelEditCity}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel Edit
                </button>
              )}
            </div>
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
