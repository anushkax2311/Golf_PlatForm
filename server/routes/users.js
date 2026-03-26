const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, country, handicap, charityContributionPercent } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (country !== undefined) updates.country = country;
    if (handicap !== undefined) updates.handicap = handicap;
    if (charityContributionPercent !== undefined) {
      updates.charityContributionPercent = Math.max(10, Math.min(100, Number(charityContributionPercent)));
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .populate('selectedCharity', 'name logo slug');

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
