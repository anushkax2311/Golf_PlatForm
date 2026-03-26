const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAnalytics, getUsers, updateUser,
  getUserScores, editUserScore,
  getWinners, verifyWinner, markPaid
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/users/:id/scores', getUserScores);
router.put('/users/:userId/scores/:scoreId', editUserScore);
router.get('/winners', getWinners);
router.put('/winners/:drawId/:winnerId', verifyWinner);
router.put('/winners/:drawId/:winnerId/pay', markPaid);

module.exports = router;
