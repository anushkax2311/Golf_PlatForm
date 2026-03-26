const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getDraws, getCurrentDraw, simulateDraw, publishDraw } = require('../controllers/drawController');

router.get('/', protect, getDraws);
router.get('/current', protect, getCurrentDraw);
router.post('/simulate', protect, adminOnly, simulateDraw);
router.post('/:id/publish', protect, adminOnly, publishDraw);

module.exports = router;
