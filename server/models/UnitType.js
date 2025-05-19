const mongoose = require('mongoose');

const UnitTypeSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  country:   { type: mongoose.Types.ObjectId, ref: 'Country', default: null }, // null = global
  costCents: { type: Number, required: true },
  attack:    { type: Number, required: true },
  defense:   { type: Number, required: true },
  speed:     { type: Number, required: true },
  hp:        { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('UnitType', UnitTypeSchema);
