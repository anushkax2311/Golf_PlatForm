const User = require('../models/User');
const Score = require('../models/Score');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [totalUsers, activeSubscribers, totalCharities, draws] = await Promise.all([
      User.countDocuments({ role: 'subscriber' }),
      User.countDocuments({ 'subscription.status': 'active' }),
      Charity.countDocuments({ isActive: true }),
      Draw.find({ status: 'published' }).sort({ year: -1, month: -1 }).limit(6)
    ]);

    const totalPrizePool = draws.reduce((sum, d) => sum + (d.prizePool?.total || 0), 0);
    const totalWinners = draws.reduce((sum, d) => sum + d.winners.length, 0);
    const charityContributions = activeSubscribers * 10 * 0.1; // 10% of £10/month estimate

    // Monthly signups (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        activeSubscribers,
        totalCharities,
        totalPrizePool,
        totalWinners,
        charityContributions,
        monthlySignups,
        recentDraws: draws
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = { role: 'subscriber' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query['subscription.status'] = status;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('selectedCharity', 'name')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { name, email, isActive, subscription } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, isActive, subscription },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user scores (admin)
// @route   GET /api/admin/users/:id/scores
exports.getUserScores = async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.params.id });
    const sorted = scoreDoc 
      ? [...scoreDoc.scores].sort((a, b) => new Date(b.date) - new Date(a.date))
      : [];
    res.json({ success: true, scores: sorted });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Edit user score (admin)
// @route   PUT /api/admin/users/:userId/scores/:scoreId
exports.editUserScore = async (req, res) => {
  try {
    const { value, date } = req.body;
    const scoreDoc = await Score.findOne({ user: req.params.userId });
    if (!scoreDoc) return res.status(404).json({ success: false, message: 'Score record not found' });

    const entry = scoreDoc.scores.id(req.params.scoreId);
    if (!entry) return res.status(404).json({ success: false, message: 'Score not found' });

    if (value) entry.value = Number(value);
    if (date) entry.date = new Date(date);
    await scoreDoc.save();

    res.json({ success: true, message: 'Score updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all winners (admin)
// @route   GET /api/admin/winners
exports.getWinners = async (req, res) => {
  try {
    const { status } = req.query;
    const draws = await Draw.find({ status: 'published', 'winners.0': { $exists: true } })
      .populate('winners.user', 'name email')
      .sort({ year: -1, month: -1 });

    let allWinners = [];
    draws.forEach(draw => {
      draw.winners.forEach(w => {
        if (!status || w.verificationStatus === status) {
          allWinners.push({
            ...w.toObject(),
            drawMonth: draw.month,
            drawYear: draw.year,
            drawId: draw._id
          });
        }
      });
    });

    res.json({ success: true, winners: allWinners });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Verify/reject winner (admin)
// @route   PUT /api/admin/winners/:drawId/:winnerId
exports.verifyWinner = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const draw = await Draw.findById(req.params.drawId);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    const winner = draw.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });

    winner.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    winner.verifiedAt = new Date();
    if (action === 'approve') winner.paymentStatus = 'pending';
    await draw.save();

    res.json({ success: true, message: `Winner ${action}d` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark winner as paid (admin)
// @route   PUT /api/admin/winners/:drawId/:winnerId/pay
exports.markPaid = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);
    const winner = draw?.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ success: false, message: 'Winner not found' });

    winner.paymentStatus = 'paid';
    winner.paidAt = new Date();
    await draw.save();

    res.json({ success: true, message: 'Marked as paid' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
