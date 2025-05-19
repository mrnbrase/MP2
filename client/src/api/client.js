import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT on every request if present
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default client;
