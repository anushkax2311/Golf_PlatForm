const express = require('express');
const router = express.Router();
const { protect, requireSubscription } = require('../middleware/auth');
const { getScores, addScore, editScore, deleteScore } = require('../controllers/scoreController');

router.get('/', protect, requireSubscription, getScores);
router.post('/', protect, requireSubscription, addScore);
router.put('/:scoreId', protect, requireSubscription, editScore);
router.delete('/:scoreId', protect, requireSubscription, deleteScore);

module.exports = router;
