const Score = require('../models/Score');

// @desc    Get user scores
// @route   GET /api/scores
exports.getScores = async (req, res) => {
  try {
    let scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      scoreDoc = await Score.create({ user: req.user._id, scores: [] });
    }

    const sorted = [...scoreDoc.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores: sorted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a score
// @route   POST /api/scores
exports.addScore = async (req, res) => {
  try {
    const { value, date } = req.body;

    if (!value || value < 1 || value > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    let scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      scoreDoc = await Score.create({ user: req.user._id, scores: [] });
    }

    scoreDoc.addScore(Number(value), date ? new Date(date) : new Date());
    await scoreDoc.save();

    const sorted = [...scoreDoc.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores: sorted, message: 'Score added successfully' });
  } catch (err) {
    console.error('Add score error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Edit a score
// @route   PUT /api/scores/:scoreId
exports.editScore = async (req, res) => {
  try {
    const { value, date } = req.body;
    const { scoreId } = req.params;

    if (!value || value < 1 || value > 45) {
      return res.status(400).json({ success: false, message: 'Score must be between 1 and 45' });
    }

    const scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      return res.status(404).json({ success: false, message: 'Score record not found' });
    }

    const entry = scoreDoc.scores.id(scoreId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Score entry not found' });
    }

    entry.value = Number(value);
    if (date) entry.date = new Date(date);
    await scoreDoc.save();

    const sorted = [...scoreDoc.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores: sorted, message: 'Score updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a score
// @route   DELETE /api/scores/:scoreId
exports.deleteScore = async (req, res) => {
  try {
    const { scoreId } = req.params;
    const scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) {
      return res.status(404).json({ success: false, message: 'Score record not found' });
    }

    scoreDoc.scores = scoreDoc.scores.filter(s => s._id.toString() !== scoreId);
    await scoreDoc.save();

    const sorted = [...scoreDoc.scores].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, scores: sorted, message: 'Score deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
