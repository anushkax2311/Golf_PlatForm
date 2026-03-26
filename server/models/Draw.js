const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchType: { type: String, enum: ['5-match', '4-match', '3-match'] },
  prizeAmount: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'rejected'],
    default: 'pending'
  },
  proofSubmitted: { type: Boolean, default: false },
  proofImage: String,
  verificationStatus: {
    type: String,
    enum: ['unsubmitted', 'pending', 'approved', 'rejected'],
    default: 'unsubmitted'
  },
  verifiedAt: Date,
  paidAt: Date
});

const drawSchema = new mongoose.Schema({
  month: {
    type: Number, // 1-12
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  drawType: {
    type: String,
    enum: ['random', 'algorithmic'],
    default: 'random'
  },
  status: {
    type: String,
    enum: ['upcoming', 'simulated', 'published'],
    default: 'upcoming'
  },
  winningNumbers: {
    type: [Number], // 5 numbers, each 1-45
    default: []
  },
  // Prize pool breakdown
  prizePool: {
    total: { type: Number, default: 0 },
    fiveMatch: { type: Number, default: 0 },  // 40%
    fourMatch: { type: Number, default: 0 },  // 35%
    threeMatch: { type: Number, default: 0 }  // 25%
  },
  jackpotRolledOver: { type: Number, default: 0 }, // rolled from previous month
  activeSubscribers: { type: Number, default: 0 },
  participantCount: { type: Number, default: 0 },
  winners: [winnerSchema],
  simulatedAt: Date,
  publishedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Unique constraint per month/year
drawSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Draw', drawSchema);
