const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  country:  { type: mongoose.Types.ObjectId, ref: 'Country', required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('City', CitySchema);
