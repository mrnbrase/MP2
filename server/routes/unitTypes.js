// server/routes/unitTypes.js
const router   = require('express').Router();
const UnitType = require('../models/UnitType');

router.get('/', async (req, res, next) => {
  try {
    const units = await UnitType.find();
    res.json(units);
  } catch (err) {
    next(err);
  }
});

module.exports = router;