const mongoose = require('mongoose');

const scoreEntrySchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: [1, 'Score must be at least 1'],
    max: [45, 'Score cannot exceed 45']
  },
  date: {
    type: Date,
    required: true
  }
}, { _id: true });

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  scores: {
    type: [scoreEntrySchema],
    validate: {
      validator: function(arr) { return arr.length <= 5; },
      message: 'Cannot store more than 5 scores'
    }
  }
}, {
  timestamps: true
});

// Add a score (rolling window of 5)
scoreSchema.methods.addScore = function(value, date) {
  const newEntry = { value, date: date || new Date() };
  this.scores.push(newEntry);
  
  // Keep only the latest 5
  if (this.scores.length > 5) {
    // Sort by date descending and keep top 5
    this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.scores = this.scores.slice(0, 5);
  }
  
  return this;
};

// Get scores in reverse chronological order
scoreSchema.virtual('sortedScores').get(function() {
  return [...this.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
});

module.exports = mongoose.model('Score', scoreSchema);
