const Charity = require('../models/Charity');
const User = require('../models/User');

// @desc    Get all charities
// @route   GET /api/charities
exports.getCharities = async (req, res) => {
  try {
    const { search, category, featured } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;

    const charities = await Charity.find(query).sort({ isFeatured: -1, name: 1 });
    res.json({ success: true, charities });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single charity
// @route   GET /api/charities/:slug
exports.getCharity = async (req, res) => {
  try {
    const charity = await Charity.findOne({ slug: req.params.slug, isActive: true });
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });
    res.json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create charity (admin)
// @route   POST /api/charities
exports.createCharity = async (req, res) => {
  try {
    const charity = await Charity.create(req.body);
    res.status(201).json({ success: true, charity });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Charity with this name already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update charity (admin)
// @route   PUT /api/charities/:id
exports.updateCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });
    res.json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete charity (admin)
// @route   DELETE /api/charities/:id
exports.deleteCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(
      req.params.id, { isActive: false }, { new: true }
    );
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });
    res.json({ success: true, message: 'Charity deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Select charity for user
// @route   PUT /api/charities/select/:id
exports.selectCharity = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found' });

    // Decrement old charity count
    if (req.user.selectedCharity) {
      await Charity.findByIdAndUpdate(req.user.selectedCharity, { $inc: { subscriberCount: -1 } });
    }

    const { contributionPercent } = req.body;
    const percent = contributionPercent ? Math.max(10, Math.min(100, Number(contributionPercent))) : 10;

    await User.findByIdAndUpdate(req.user._id, {
      selectedCharity: charity._id,
      charityContributionPercent: percent
    });

    // Increment new charity count
    await Charity.findByIdAndUpdate(charity._id, { $inc: { subscriberCount: 1 } });

    res.json({ success: true, message: 'Charity selected successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
