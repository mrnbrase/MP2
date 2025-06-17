const mongoose = require('mongoose');

const DiplomacySchema = new mongoose.Schema({
  countryA: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  countryB: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  status: {
    type: String,
    enum: [
      'alliance',
      'neutral',
      'war',
      'non_aggression_pact',
      'trade_agreement',
      'pending_alliance',
      'pending_non_aggression_pact',
      'pending_trade_agreement'
    ],
    required: true
  },
  proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  isActive: { type: Boolean, default: false },
  proposedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  terminatedAt: { type: Date }
});

// Pre-save hook to sort country IDs and ensure countryA is always the smaller ID
DiplomacySchema.pre('save', function(next) {
  if (this.countryA && this.countryB) {
    // Mongoose ObjectIds can be compared directly as strings
    if (this.countryA.toString() > this.countryB.toString()) {
      const temp = this.countryA;
      this.countryA = this.countryB;
      this.countryB = temp;
    }
  }
  next();
});

DiplomacySchema.index({ countryA: 1, countryB: 1 }, { unique: true });

const Diplomacy = mongoose.model('Diplomacy', DiplomacySchema);

module.exports = Diplomacy;
