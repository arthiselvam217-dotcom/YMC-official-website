const express = require('express');
const router = express.Router();
const {
  getPodcasts,
  addPodcast,
  deletePodcast,
  getTdcTalks,
  addTdcTalk,
  deleteTdcTalk,
} = require('../controllers/mediaController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
  * Podcasts Endpoints
  */
// Public: Get all podcast episodes
router.get('/podcasts', getPodcasts);

// Protected (Admin & Board): Add new podcast episode
router.post('/podcasts', protect, authorize('admin', 'board'), addPodcast);

// Protected (Admin & Board): Delete podcast episode
router.delete('/podcasts/:id', protect, authorize('admin', 'board'), deletePodcast);

/**
  * Tech Developer's Community (TDC) Talks Endpoints
  */
// Public: Get TDC talks (supports ?year=YYYY)
router.get('/tdc-talks', getTdcTalks);

// Protected (Admin & Board): Add new TDC talk
router.post('/tdc-talks', protect, authorize('admin', 'board'), addTdcTalk);

// Protected (Admin & Board): Delete TDC talk
router.delete('/tdc-talks/:id', protect, authorize('admin', 'board'), deleteTdcTalk);

module.exports = router;
