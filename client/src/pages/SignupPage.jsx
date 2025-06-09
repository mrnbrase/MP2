import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const { user, signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'president') navigate('/dashboard', { replace: true });
    else navigate('/election', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await signup(email, password, country);
      navigate('/select-country'); // or wherever your flow goes next
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="form-container">
      <h2>Sign Up</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className="input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Country Code (e.g. SA)"
          className="input"
          value={country}
          onChange={e => setCountry(e.target.value)}
          required
        />
        <button type="submit" className="button full-width" style={{marginTop:'1rem'}}>
          Sign Up
        </button>
      </form>
      <p className="text-center mt-2 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600">Log In</Link>
      </p>
    </div>
  );
}
