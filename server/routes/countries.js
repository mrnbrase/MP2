// server/routes/countries.js
const router  = require('express').Router();
const Country = require('../models/Country');
// … your auth middleware if any …

// GET all countries
router.get('/', async (req, res, next) => {
  try {
    const list = await Country.find();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET one country by id (for GeoJSON)
router.get('/:id', async (req, res, next) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) return res.status(404).json({ error: 'Not found' });
    res.json(country);
  } catch (err) {
    next(err);
  }
});

// … your POST/PUT/DELETE for admins …
module.exports = router;
