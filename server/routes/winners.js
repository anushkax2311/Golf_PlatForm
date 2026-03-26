const express = require('express');
const router = express.Router();
const { protect, requireSubscription } = require('../middleware/auth');
const { submitProof, getMyWinnings, uploadMiddleware } = require('../controllers/winnerController');

router.get('/my-winnings', protect, getMyWinnings);
router.post('/proof/:drawId', protect, requireSubscription, uploadMiddleware, submitProof);

module.exports = router;
