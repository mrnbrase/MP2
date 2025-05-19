// server/routes/dashboard.js
const router       = require('express').Router();
const mongoose     = require('mongoose');
const authenticate = require('../middleware/auth');
const Resource     = require('../models/Resource');
const UnitType     = require('../models/UnitType');
const Event        = require('../models/Event');
const Country      = require('../models/Country');
const BuildingType = require('../models/BuildingType');
const City         = require('../models/City');
// GET /api/dashboard/:countryId
// Returns: { resource, unitTypes, pendingEvents }
router.get(
  '/:countryId',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId = req.params.countryId;
      if (
        req.user.country.toString() !== countryId &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const [ resource, unitTypes, pendingEvents ] = await Promise.all([
        Resource.findOne({ country: countryId }),
        UnitType.find({ $or: [{ country: null }, { country: countryId }] }),
        Event.find({ toCountry: countryId, resolved: false })
      ]);
      res.json({ resource, unitTypes, pendingEvents });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/dashboard/:countryId/buy-unit
router.post(
  '/:countryId/buy-unit',
  authenticate,
  async (req, res, next) => {
    try {
      const { unitTypeId, quantity, targetCountryId, type } = req.body;
      const countryId = req.params.countryId;
      if (
        req.user.role !== 'president' ||
        req.user.country.toString() !== countryId
      ) {
        return res.status(403).json({ error: 'Only the president can buy units' });
      }
      const [unit, resrc] = await Promise.all([
        UnitType.findById(unitTypeId),
        Resource.findOne({ country: countryId })
      ]);
      if (!unit || !resrc) {
        return res.status(404).json({ error: 'Unit type or resources not found' });
      }
      const totalCost = unit.costCents * quantity;
      if (resrc.moneyCentsPerSecond < totalCost) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      resrc.moneyCentsPerSecond -= totalCost;
      await resrc.save();
      const now = new Date();
      const travelTimeMs = Math.ceil((quantity * 1000) / unit.speed);
      const arrivesAt = new Date(now.getTime() + travelTimeMs);
      const dest = await Country.findById(targetCountryId);
      let [lngSum, latSum, count] = [0, 0, 0];
      dest.geojson.features.forEach(feat => {
        feat.geometry.coordinates[0].forEach(([lng, lat]) => {
          lngSum += lng;
          latSum += lat;
          count++;
        });
      });
      const centroid = { lat: latSum / count, lng: lngSum / count };
      const ev = await Event.create({
        type,
        fromCountry: countryId,
        toCountry:   targetCountryId,
        unitType:    unitTypeId,
        quantity,
        sentAt:   now,
        arrivesAt,
        location: centroid,
        resolved: false
      });
      res.status(201).json(ev);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/dashboard/:countryId/build-generator
router.post(
  '/:countryId/build-generator',
  authenticate,
  async (req, res, next) => {
    try {
      const { costCents, moneyCentsPerSecondDelta, oilUnitsPerSecondDelta } = req.body;
      const countryId = req.params.countryId;
      if (
        req.user.role !== 'president' ||
        req.user.country.toString() !== countryId
      ) {
        return res.status(403).json({ error: 'Only the president can build generators' });
      }
      const resrc = await Resource.findOne({ country: countryId });
      if (!resrc) {
        return res.status(404).json({ error: 'Resources not found' });
      }
      if (resrc.moneyCentsPerSecond < costCents) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      resrc.moneyCentsPerSecond -= costCents;
      resrc.moneyCentsPerSecond += moneyCentsPerSecondDelta;
      resrc.oilUnitsPerSecond   += oilUnitsPerSecondDelta;
      await resrc.save();
      res.json({ message: 'Generator built' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/:countryId/overview
router.get(
  '/:countryId/overview',
  authenticate,
  async (req, res, next) => {
    try {
      const cid = req.params.countryId;
      const resource = await Resource.findOne({ country: cid }).lean();
      const country  = await Country.findById(cid).lean();
      const { landLimit, usedLand } = country;
      const pendingEvents = await Event.find({
        toCountry: cid,
        resolved:  false
      }).lean();
      res.json({ resource, landLimit, usedLand, pendingEvents });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/:countryId/unit-types
router.get(
  '/:countryId/unit-types',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId = req.params.countryId;
      if (
        req.user.country.toString() !== countryId &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const list = await UnitType.find({
        $or: [{ country: null }, { country: countryId }]
      });
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/:countryId/inventory
router.get(
  '/:countryId/inventory',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId = req.params.countryId;
      if (
        req.user.role !== 'president' ||
        req.user.country.toString() !== countryId
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Adjust this aggregation to match your purchase schema
      const inv = await Resource.aggregate([
        { $match: { country: mongoose.Types.ObjectId(countryId) } },
        { $unwind: '$purchases' },
        { $group: {
            _id: '$purchases.unitType',
            count: { $sum: '$purchases.quantity' }
          }
        },
        { $lookup: {
            from: 'unittypes',
            localField: '_id',
            foreignField: '_id',
            as: 'unit'
          }
        },
        { $unwind: '$unit' },
        { $project: {
            unitType: '$_id',
            count: 1,
            name: '$unit.name'
          }
        }
      ]);
      res.json(inv);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/dashboard/:countryId/send-unit
router.post(
  '/:countryId/send-unit',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId = req.params.countryId;
      if (
        req.user.role !== 'president' ||
        req.user.country.toString() !== countryId
      ) {
        return res.status(403).json({ error: 'Only the president can send units' });
      }
      const { unitTypeId, quantity, targetCountryId, type } = req.body;
      const unit = await UnitType.findById(unitTypeId);
      if (!unit) return res.status(404).json({ error: 'Unit type not found' });
      const now = new Date();
      const travelTimeMs = Math.ceil((quantity * 1000) / unit.speed);
      const arrivesAt = new Date(now.getTime() + travelTimeMs);
      const tgt = await Country.findById(targetCountryId);
      let [lngSum, latSum, count] = [0, 0, 0];
      tgt.geojson.features.forEach(f =>
        f.geometry.coordinates[0].forEach(([lng, lat]) => {
          lngSum += lng; latSum += lat; count++;
        })
      );
      const centroid = { lat: latSum/count, lng: lngSum/count };
      const ev = await Event.create({
        type,
        fromCountry: countryId,
        toCountry:   targetCountryId,
        unitType:    unitTypeId,
        quantity,
        sentAt:   now,
        arrivesAt,
        location: centroid,
        resolved: false
      });
      res.status(201).json(ev);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/dashboard/:countryId/building-types
router.get(
  '/:countryId/building-types',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId = req.params.countryId;
      // only president or admin can fetch
      if (
        req.user.country.toString() !== countryId &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // includes global (country:null) and country-specific
      const list = await BuildingType.find({
        $or: [{ country: null }, { country: countryId }]
      });
      res.json(list);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/dashboard/:countryId/build
router.post(
  '/:countryId/build',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId = req.params.countryId;
      const { buildingTypeId } = req.body;

      // only president can build
      if (
        req.user.role !== 'president' ||
        req.user.country.toString() !== countryId
      ) {
        return res.status(403).json({ error: 'Only the president can build' });
      }

      const bType = await BuildingType.findById(buildingTypeId);
      if (!bType) {
        return res.status(404).json({ error: 'Building type not found' });
      }

      // load country to check land
      const country = await Country.findById(countryId);
      if (country.usedLand + bType.landUsage > country.landLimit) {
        return res.status(400).json({ error: 'Not enough land available' });
      }

      // load & check resources
      const resrc = await Resource.findOne({ country: countryId });
      if (resrc.moneyCentsPerSecond < bType.costCents) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      // deduct cost immediately
      resrc.moneyCentsPerSecond -= bType.costCents;
      await resrc.save();

      // schedule a build event that when resolved will increase land usage & output
      const now = new Date();
      // e.g. buildTime = 1 minute per land unit
      const buildTimeMs = bType.landUsage * 60 * 1000;
      const completesAt = new Date(now.getTime() + buildTimeMs);

      const ev = await Event.create({
        type: 'build',
        fromCountry: countryId,
        buildingType: buildingTypeId,
        sentAt: now,
        arrivesAt: completesAt,
        resolved: false
      });

      res.status(201).json(ev);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:countryId/build',
  authenticate,
  async (req, res, next) => {
    try {
      const countryId      = req.params.countryId;
      const { buildingTypeId, cityId } = req.body;

      if (
        req.user.role !== 'president' ||
        req.user.country.toString() !== countryId
      ) {
        return res.status(403).json({ error: 'Only the president can build' });
      }

      const bType = await BuildingType.findById(buildingTypeId);
      if (!bType) return res.status(404).json({ error: 'Building type not found' });

      // land check
      const country = await Country.findById(countryId);
      if (country.usedLand + bType.landUsage > country.landLimit) {
        return res.status(400).json({ error: 'Not enough land available' });
      }

      // resource check & deduction
      const resrc = await Resource.findOne({ country: countryId });
      if (resrc.moneyCentsPerSecond < bType.costCents) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      resrc.moneyCentsPerSecond -= bType.costCents;
      await resrc.save();

      // lookup city for location
      const city = await City.findById(cityId);
      if (!city) return res.status(404).json({ error: 'City not found' });

      // schedule build event
      const now = new Date();
      const buildTimeMs = bType.landUsage * 60 * 1000;  // e.g. 1min per land unit
      const arrivesAt   = new Date(now.getTime() + buildTimeMs);

      const ev = await Event.create({
        type: 'build',
        fromCountry: countryId,
        buildingType: buildingTypeId,
        city: cityId,
        sentAt: now,
        arrivesAt,
        location: city.location,
        resolved: false
      });

      res.status(201).json(ev);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
