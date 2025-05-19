const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  country:              { type: mongoose.Types.ObjectId, ref: 'Country', unique: true },
  moneyCentsPerSecond:  { type: Number, default: 0 },
  oilUnitsPerSecond:    { type: Number, default: 0 }
});

module.exports = mongoose.model('Resource', ResourceSchema);
