const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getCharities, getCharity, createCharity, updateCharity, deleteCharity, selectCharity
} = require('../controllers/charityController');

router.get('/', getCharities);
router.get('/:slug', getCharity);
router.post('/', protect, adminOnly, createCharity);
router.put('/select/:id', protect, selectCharity);
router.put('/:id', protect, adminOnly, updateCharity);
router.delete('/:id', protect, adminOnly, deleteCharity);

module.exports = router;
