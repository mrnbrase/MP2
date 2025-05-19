const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['attack','spy','nuke','build'],
    required: true
  },
  fromCountry: {
    type: mongoose.Types.ObjectId,
    ref: 'Country',
    required: true
  },
  // only for attacks/spies/nukes:
  toCountry: {
    type: mongoose.Types.ObjectId,
    ref: 'Country',
    required: function() { return this.type !== 'build'; }
  },
  // only for military moves:
  unitType: {
    type: mongoose.Types.ObjectId,
    ref: 'UnitType',
    required: function() { return ['attack','spy','nuke'].includes(this.type); }
  },
  quantity: {
    type: Number,
    required: function() { return ['attack','spy','nuke'].includes(this.type); }
  },
  // only for builds:
  buildingType: {
    type: mongoose.Types.ObjectId,
    ref: 'BuildingType',
    required: function() { return this.type === 'build'; }
  },
  city: {
    type: mongoose.Types.ObjectId,
    ref: 'City',
    required: function() { return this.type === 'build'; }
  },
  sentAt: {
    type: Date,
    required: true
  },
  arrivesAt: {
    type: Date,
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  resolved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
