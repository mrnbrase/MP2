import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import apiClient from '../api/client';
// import { Link } from 'react-router-dom'; // Link seems unused, can be removed
import toast from 'react-hot-toast'; // Import toast

const DiplomacyPage = () => {
  const { user } = useContext(AuthContext);
  const [diplomacyData, setDiplomacyData] = useState({
    activeAgreements: [],
    pendingIncoming: [],
    pendingOutgoing: [],
  });
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [error, setError] = useState(null); // Replaced by toast for main data load error
  // States for the proposal form
  const [targetCountryId, setTargetCountryId] = useState('');
  const [proposedStatus, setProposedStatus] = useState('alliance'); // Default proposal type

  // const [actionError, setActionError] = useState(null); // Replaced by toasts
  // const [actionSuccess, setActionSuccess] = useState(null); // Replaced by toasts


  const fetchDiplomacyData = async () => {
    setIsLoading(true);
    // setError(null); // Not needed
    // setActionError(null); // Not needed
    // setActionSuccess(null); // Not needed
    try {
      const response = await apiClient.get('/diplomacy/my-country');
      const myCountryId = user?.country?._id || user?.country;

      const active = [];
      const incoming = [];
      const outgoing = [];

      response.data.forEach(diplomacy => {
        if (diplomacy.isActive) {
          active.push(diplomacy);
        } else {
          const userCountryObjectId = typeof myCountryId === 'string' ? myCountryId : myCountryId?.toString();
          if (diplomacy.proposedBy._id.toString() !== userCountryObjectId) {
            incoming.push(diplomacy);
          } else {
            outgoing.push(diplomacy);
          }
        }
      });
      setDiplomacyData({ activeAgreements: active, pendingIncoming: incoming, pendingOutgoing: outgoing });
    } catch (err) {
      console.error("Error fetching diplomacy data:", err);
      toast.error(err.response?.data?.message || 'Failed to fetch diplomatic information.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await apiClient.get('/countries');
      const myCountryId = user?.country?._id || user?.country;
      setCountries(response.data.filter(c => c._id.toString() !== myCountryId?.toString()));
    } catch (err) {
      console.error("Error fetching countries:", err);
      toast.error(err.response?.data?.message || 'Failed to fetch countries for proposal form.');
    }
  };

  useEffect(() => {
    if (user?.country) {
      fetchDiplomacyData();
      if (user.role === 'president') {
        fetchCountries();
      }
    }
  }, [user]); // Removed user.country, user.role as direct dependencies; user object itself is enough

  // Helper to display country names
  const getCountryName = (country) => country?.name || 'Unknown Country';
  const getOtherCountry = (diplomacy) => {
    const myCountryId = user?.country?._id || user?.country;
    if (diplomacy.countryA?._id?.toString() === myCountryId?.toString()) {
        return diplomacy.countryB;
    }
    return diplomacy.countryA;
  };


  const handlePropose = async (e) => {
    e.preventDefault();
    // setActionError(null); // Not needed
    // setActionSuccess(null); // Not needed
    if (!targetCountryId || !proposedStatus) {
        toast.error("Target country and status are required for a proposal.");
        return;
    }
    try {
        await apiClient.post('/diplomacy/propose', { targetCountryId, proposedStatus });
        const targetCountryName = countries.find(c => c._id === targetCountryId)?.name || 'the selected country';
        toast.success(`Proposal for ${proposedStatus.replace('_', ' ')} sent to ${targetCountryName}.`);
        fetchDiplomacyData(); // Refresh list
        setTargetCountryId(''); // Reset form
        setProposedStatus('alliance'); // Reset status to default
    } catch (err) {
        console.error("Error proposing diplomacy:", err);
        toast.error(err.response?.data?.message || 'Failed to send proposal.');
    }
  };

  const handleAccept = async (diplomacyId) => {
    // setActionError(null); // Not needed
    // setActionSuccess(null); // Not needed
    try {
        await apiClient.post(`/diplomacy/${diplomacyId}/accept`);
        toast.success('Proposal accepted successfully.');
        fetchDiplomacyData();
    } catch (err) {
        console.error("Error accepting proposal:", err);
        toast.error(err.response?.data?.message || 'Failed to accept proposal.');
    }
  };

  const handleReject = async (diplomacyId) => {
    // setActionError(null); // Not needed
    // setActionSuccess(null); // Not needed
    try {
        await apiClient.post(`/diplomacy/${diplomacyId}/reject`);
        toast.success('Proposal rejected/cancelled successfully.');
        fetchDiplomacyData();
    } catch (err) {
        console.error("Error rejecting proposal:", err);
        toast.error(err.response?.data?.message || 'Failed to reject proposal.');
    }
  };

  const handleBreakAgreement = async (diplomacyId, currentStatus) => {
    // setActionError(null); // Not needed
    // setActionSuccess(null); // Not needed
    try {
        await apiClient.post(`/diplomacy/${diplomacyId}/break`);
        const message = currentStatus === 'war' ? 'Peace declared (moved to neutral).' : 'Agreement broken (moved to war).';
        toast.success(message);
        fetchDiplomacyData();
    } catch (err) {
        console.error("Error breaking agreement:", err);
        toast.error(err.response?.data?.message || 'Failed to break agreement.');
    }
  };


  if (isLoading) return <p>Loading diplomatic information...</p>;
  // if (error) return <p style={{ color: 'red' }}>{error}</p>; // Main error handled by toast
  if (!user?.country) return <p>You must be associated with a country to view diplomacy.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Diplomacy Dashboard</h1>
      {/* {actionError && <p style={{ color: 'red' }}>Error: {actionError}</p>} */} {/* Replaced by toasts */}
      {/* {actionSuccess && <p style={{ color: 'green' }}>Success: {actionSuccess}</p>} */} {/* Replaced by toasts */}

      {user.role === 'president' && (
        <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
          <h2>Propose New Diplomatic Agreement</h2>
          <form onSubmit={handlePropose}>
            <div>
              <label htmlFor="targetCountry">Target Country: </label>
              <select id="targetCountry" value={targetCountryId} onChange={(e) => setTargetCountryId(e.target.value)} /*required*/>
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country._id} value={country._id}>{country.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label htmlFor="proposedStatus">Status to Propose: </label>
              <select id="proposedStatus" value={proposedStatus} onChange={(e) => setProposedStatus(e.target.value)} /*required*/>
                <option value="alliance">Alliance</option>
                <option value="non_aggression_pact">Non-Aggression Pact</option>
                <option value="trade_agreement">Trade Agreement</option>
                <option value="war">Declare War</option>
              </select>
            </div>
            <button type="submit" style={{ marginTop: '10px' }}>Send Proposal</button>
          </form>
        </section>
      )}

      <section>
        <h2>Active Agreements</h2>
        {diplomacyData.activeAgreements.length > 0 ? (
          <ul>
            {diplomacyData.activeAgreements.map(dip => (
              <li key={dip._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee' }}>
                Partner: <strong>{getCountryName(getOtherCountry(dip))}</strong> | Status: <strong>{dip.status.replace('_', ' ')}</strong>
                <br />
                Established: {new Date(dip.acceptedAt).toLocaleDateString()}
                {user.role === 'president' && (
                  <button
                    onClick={() => handleBreakAgreement(dip._id, dip.status)}
                    style={{ marginLeft: '10px', backgroundColor: dip.status === 'war' ? 'lightgreen' : 'pink' }}
                  >
                    {dip.status === 'war' ? 'Declare Peace (Neutral)' : 'Break & Declare War'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : <p>No active diplomatic agreements.</p>}
      </section>

      <section style={{ marginTop: '30px' }}>
        <h2>Pending Proposals (Incoming)</h2>
        {diplomacyData.pendingIncoming.length > 0 ? (
          <ul>
            {diplomacyData.pendingIncoming.map(dip => (
              <li key={dip._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee' }}>
                Proposed by: <strong>{getCountryName(dip.proposedBy)}</strong> | Proposal: <strong>{dip.status.replace('pending_', '').replace('_', ' ')}</strong>
                <br />
                Proposed At: {new Date(dip.proposedAt).toLocaleDateString()}
                {user.role === 'president' && (
                  <>
                    <button onClick={() => handleAccept(dip._id)} style={{ marginLeft: '10px', backgroundColor: 'lightgreen' }}>Accept</button>
                    <button onClick={() => handleReject(dip._id)} style={{ marginLeft: '10px', backgroundColor: 'pink' }}>Reject</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : <p>No incoming proposals.</p>}
      </section>

      <section style={{ marginTop: '30px' }}>
        <h2>Pending Proposals (Outgoing)</h2>
        {diplomacyData.pendingOutgoing.length > 0 ? (
          <ul>
            {diplomacyData.pendingOutgoing.map(dip => (
              <li key={dip._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee' }}>
                Target: <strong>{getCountryName(getOtherCountry(dip))}</strong> | Proposal: <strong>{dip.status.replace('pending_', '').replace('_', ' ')}</strong>
                <br />
                Proposed At: {new Date(dip.proposedAt).toLocaleDateString()}
                {user.role === 'president' && (
                  <button onClick={() => handleReject(dip._id)} style={{ marginLeft: '10px', backgroundColor: 'orange' }}>Cancel Proposal</button>
                )}
              </li>
            ))}
          </ul>
        ) : <p>No outgoing proposals.</p>}
      </section>
    </div>
  );
};

export default DiplomacyPage;
