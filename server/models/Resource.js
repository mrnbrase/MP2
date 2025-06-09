const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  country:              { type: mongoose.Types.ObjectId, ref: 'Country', unique: true },
  // current amounts
  moneyCents:           { type: Number, default: 0 },
  oilUnits:             { type: Number, default: 0 },
  // generation rates
  moneyCentsPerSecond:  { type: Number, default: 0 },
  oilUnitsPerSecond:    { type: Number, default: 0 }
});

module.exports = mongoose.model('Resource', ResourceSchema);
