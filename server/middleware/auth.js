const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { blacklist } = require('../utils/tokenBlacklist');

module.exports = async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or malformed token' });

  const token = authHeader.split(' ')[1];
  if (blacklist.has(token))
    return res.status(401).json({ error: 'Token has been logged out' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to the request
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { id: user._id, role: user.role, country: user.country };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
