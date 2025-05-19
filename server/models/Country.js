const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  // store simplified GeoJSON polygon for the map
  geojson: {
    type: { type: String, enum: ['FeatureCollection'], default: 'FeatureCollection' },
    features: {
      type: [
        {
          type: { type: String, enum: ['Feature'], required: true },
          geometry: {
            type: { type: String, enum: ['Polygon','MultiPolygon'], required: true },
            coordinates: { type: Array, required: true }
          },
          properties: { type: Object }
        }
      ],
      default: []
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Country', CountrySchema);
