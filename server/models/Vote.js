const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Prevent double-voting: one vote per election per user
VoteSchema.index({ election: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', VoteSchema);
