const mongoose = require('mongoose');

const BuildingTypeSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  country:     { type: mongoose.Types.ObjectId, ref: 'Country', default: null },
  costCents:   { type: Number, required: true },
  landUsage:   { type: Number, required: true },
  moneyDeltaPerSecond: { type: Number, required: true },
  oilDeltaPerSecond:   { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('BuildingType', BuildingTypeSchema);
