const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createCheckout, createPortal, webhook, getStatus } = require('../controllers/paymentController');

router.post('/create-checkout', protect, createCheckout);
router.post('/portal', protect, createPortal);
router.post('/webhook', webhook);
router.get('/status', protect, getStatus);

module.exports = router;
