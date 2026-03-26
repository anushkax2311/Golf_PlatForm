const Draw = require('../models/Draw');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/proofs';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `proof_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

exports.uploadMiddleware = upload.single('proof');

// @desc    Submit winner proof
// @route   POST /api/winners/proof/:drawId
exports.submitProof = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found' });

    const winner = draw.winners.find(w => w.user.toString() === req.user._id.toString());
    if (!winner) return res.status(404).json({ success: false, message: 'You are not a winner in this draw' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    winner.proofSubmitted = true;
    winner.proofImage = req.file.path;
    winner.verificationStatus = 'pending';
    await draw.save();

    res.json({ success: true, message: 'Proof submitted for review' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's winnings across all draws
// @route   GET /api/winners/my-winnings
exports.getMyWinnings = async (req, res) => {
  try {
    const draws = await Draw.find({
      status: 'published',
      'winners.user': req.user._id
    }).sort({ year: -1, month: -1 });

    const winnings = [];
    draws.forEach(draw => {
      draw.winners
        .filter(w => w.user.toString() === req.user._id.toString())
        .forEach(w => {
          winnings.push({
            ...w.toObject(),
            drawMonth: draw.month,
            drawYear: draw.year,
            drawId: draw._id
          });
        });
    });

    const totalWon = winnings
      .filter(w => w.paymentStatus === 'paid')
      .reduce((sum, w) => sum + (w.prizeAmount || 0), 0);

    res.json({ success: true, winnings, totalWon });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
