// server/routes/admin.js
const router   = require('express').Router();
const mongoose = require('mongoose');
const authenticate = require('../middleware/auth');
const Country  = require('../models/Country');
const UnitType = require('../models/UnitType');
const BuildingType = require('../models/BuildingType');
const Resource = require('../models/Resource');
const Election = require('../models/Election');
const Vote     = require('../models/Vote');
const User     = require('../models/User');
const City = require('../models/City');

// POST /api/admin/seed
router.post(
  '/seed',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin only' });

      // 1) Seed UnitTypes
      const units = [
        { name: 'Infantry', costCents: 1000,  attack: 5,   defense: 5,  speed: 10, hp: 20  },
        { name: 'Tank',      costCents: 10000, attack: 20,  defense: 20, speed: 5,  hp: 100 },
        { name: 'Plane',     costCents: 20000, attack: 30,  defense: 10, speed: 20, hp: 50  },
        { name: 'Missile',   costCents: 50000, attack: 80,  defense: 0,  speed: 50, hp: 1   },
        { name: 'Nuke',      costCents:100000, attack:200,  defense: 0,  speed:100, hp: 1   }
      ];
      for (const u of units) {
        await UnitType.updateOne(
          { name: u.name },
          { $set: u },
          { upsert: true }
        );
      }

      // 2) Seed Resources for each country
      const countries = await Country.find();
      for (const c of countries) {
        await Resource.updateOne(
          { country: c._id },
          {
            $setOnInsert: {
              country:            c._id,
              moneyCentsPerSecond: 277,  // $2.77/sec ≈ $10k/hr
              oilUnitsPerSecond:  1
            }
          },
          { upsert: true }
        );
      }

      return res.json({
        message:     'Seed complete',
        unitCount:   units.length,
        countryCount:countries.length
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/ban/:id
router.post(
  '/ban/:id',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin only' });

      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'User banned' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/elections/close/:id
router.post(
  '/elections/close/:id',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
      }

      const election = await Election.findById(req.params.id);
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      if (election.isClosed) {
        return res.status(400).json({ error: 'Election already closed' });
      }

      // Tally votes
      const [winner] = await Vote.aggregate([
        { $match: { election: election._id } },
        { $group: { _id: '$candidate', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
      if (!winner) {
        return res.status(400).json({ error: 'No votes cast' });
      }

      // 1) Close the election
      await Election.findByIdAndUpdate(election._id, { isClosed: true });

      // 2) Demote any existing president in that country
      await User.updateMany(
        { country: election.country, role: 'president' },
        { role: 'player' }
      );

      // 3) Promote the new winner
      await User.findByIdAndUpdate(winner._id, { role: 'president' });

      return res.json({ message: 'Election closed', winner: winner._id });
    } catch (err) {
      next(err);
    }
  }
);

// GET all unit-types (global + this country)
router.get(
  '/unit-types',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const list = await UnitType.find({
        $or: [{ country: null }, { country: req.user.country }]
      });
      res.json(list);
    } catch (err) { next(err) }
  }
);

// POST create/update a unit-type
router.post(
  '/unit-types',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const data = { ...req.body, country: req.body.country || null };
      const unit = await UnitType.create(data);
      res.status(201).json(unit);
    } catch (err) { next(err) }
  }
);

// GET all building-types (global + this country)
router.get(
  '/building-types',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const list = await BuildingType.find({
        $or: [{ country: null }, { country: req.user.country }]
      });
      res.json(list);
    } catch (err) { next(err) }
  }
);

// POST create a building-type
router.post(
  '/building-types',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      const data = { ...req.body, country: req.body.country || null };
      const build = await BuildingType.create(data);
      res.status(201).json(build);
    } catch (err) { next(err) }
  }
);

// GET all cities for this admin’s country
router.get(
  '/cities',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin only' });

      const cities = await City.find().populate('country','name');
      res.json(cities);
    } catch (err) {
      next(err);
    }
  }
);

// POST create a new city
router.post(
  '/cities',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Admin only' });

      const { name, lat, lng, country: countryId } = req.body;

      // validate country
      if (!mongoose.Types.ObjectId.isValid(countryId)) {
        return res.status(400).json({ error: 'Invalid country id' });
      }
      const country = await Country.findById(countryId);
      if (!country) {
        return res.status(404).json({ error: 'Country not found' });
      }

      const city = await City.create({
        name,
        country: countryId,
        location: { lat, lng }
      });

      res.status(201).json(city);
    } catch (err) {
      next(err);
    }
  }
);
module.exports = router;
