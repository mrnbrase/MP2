import React, { useState, useEffect, useContext } from 'react';
import client from '../api/client';
import { AuthContext } from '../contexts/AuthContext';

export default function ElectionPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // 1) Fetch current election + vote status
        const { data } = await client.get('/elections/current');
        setElection(data.election);
        setHasVoted(data.hasVoted);

        if (!data.election) {
          setError('No active election right now');
          return;
        }

        // 2) Fetch all “player” candidates in your country
        const { data: users } = await client.get(
          `/users?country=${user.country}`
        );
        setCandidates(users);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load election');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.country]);

  const handleVote = async candidateId => {
    try {
      await client.post('/elections/vote', {
        electionId: election._id,
        candidateId
      });
      setHasVoted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Vote failed');
    }
  };

  if (loading) return <div>Loading election…</div>;
  if (error)   return <div className="text-red-600">{error}</div>;
  if (!election) return <div>No election is open.</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Election for {user.country}</h2>

      {hasVoted ? (
        <div className="text-green-600">✅ You’ve already voted.</div>
      ) : (
        <ul className="space-y-2">
          {candidates.map(c => (
            <li
              key={c._id}
              className="p-2 border flex justify-between items-center"
            >
              <span>{c.email}</span>
              <button
                onClick={() => handleVote(c._id)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Vote
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
