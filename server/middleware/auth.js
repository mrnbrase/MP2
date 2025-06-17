const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { blacklist } = require('../utils/tokenBlacklist');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing or malformed token' });

  const token = authHeader.split(' ')[1];
  if (blacklist.has(token))
    return res.status(401).json({ error: 'Token has been logged out' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to the request
    const userDoc = await User.findById(payload.id).select('-password'); // Renamed to userDoc to avoid conflict
    if (!userDoc) return res.status(401).json({ error: 'User not found' });

    req.user = { id: userDoc._id, role: userDoc.role, country: userDoc.country };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function presidentialRoleRequired(req, res, next) {
  if (!req.user || req.user.role !== 'president') {
    return res.status(403).json({ message: 'Access denied. Presidential role required.' });
  }
  next();
}

module.exports = {
  authenticate,
  presidentialRoleRequired,
};
