// server/routes/resources.js
const router   = require('express').Router();
const Resource = require('../models/Resource');

router.get('/', async (req, res, next) => {
  try {
    const all = await Resource.find().populate('country','name');
    res.json(all);
  } catch (err) {
    next(err);
  }
});

router.get('/:countryId', async (req, res, next) => {
  try {
    const one = await Resource.findOne({ country: req.params.countryId });
    res.json(one);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
