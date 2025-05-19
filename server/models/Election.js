const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  weekStart: {
    type: Date,
    required: true
  },
  weekEnd: {
    type: Date,
    required: true
  },
  isClosed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// ensure only one open election per country/week
ElectionSchema.index({ country: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('Election', ElectionSchema);
