const express = require('express');
const router = express.Router();
const {
  getActiveBloodNeeds,
  getAllBloodNeeds,
  createBloodNeed,
  updateBloodNeedStatus,
  registerDonor,
  searchDonors,
  getDonorProfile,
  updateDonorProfile,
  deleteDonorProfile,
  getBloodStats,
  getAllDonors,
  getDonorById,
} = require('../controllers/bloodController');

/**
 * Urgent Blood Requests / Needs
 */
// Get active blood requests (open)
router.get('/needs', getActiveBloodNeeds);

// Get all blood requests (with optional ?status=open|fulfilled|cancelled)
router.get('/needs/all', getAllBloodNeeds);

// Submit urgent blood request
router.post('/needs', createBloodNeed);

// Update blood request status (open/fulfilled/cancelled)
router.patch('/needs/:id/status', updateBloodNeedStatus);

/**
 * Blood Donors & Search
 */
// Register as a blood donor
router.post('/donors', registerDonor);

// Search donors by bloodGroup and/or location (query parameters)
router.get('/donors/search', searchDonors);

// Get aggregate blood group statistics
router.get('/stats', getBloodStats);

// Get all registered donors
router.get('/donors', getAllDonors);

// Get donor self-service profile by email
router.post('/donors/profile', getDonorProfile);

// Get single donor by ID
router.get('/donors/:id', getDonorById);

// Update donor profile
router.put('/donors/:id', updateDonorProfile);

// Delete donor profile
router.delete('/donors/:id', deleteDonorProfile);

module.exports = router;
