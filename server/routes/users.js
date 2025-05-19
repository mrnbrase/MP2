// server/routes/users.js
const router = require('express').Router();
const User   = require('../models/User');

// GET /api/users?country=<countryId>
// returns all profiles in that country with role 'player'
router.get('/', async (req, res, next) => {
  try {
    const countryId = req.query.country;
    if (!countryId) return res.status(400).json({ error: 'country query required' });

    // only allow your own country, unless admin
    if (req.user.country.toString() !== countryId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await User
      .find({ country: countryId, role: 'player' })
      .select('_id email');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
