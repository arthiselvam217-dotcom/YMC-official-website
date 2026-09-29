const express = require('express');
const router = express.Router();
const {
  submitApplication,
  getApplications,
  getPendingApplications,
  getApplicationById,
  approveApplication,
  deleteApplication,
  getMemberDashboard,
  getAllMembers,
  updateMemberPoints,
  toggleProudMember,
  deleteMember,
} = require('../controllers/memberController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Public Routes
 */
// Submit new membership application
router.post('/apply', submitApplication);

/**
 * Member Protected Routes (All active authenticated members)
 */
// Member dashboard: user details, proud members, active members leaderboard
router.get('/dashboard', protect, getMemberDashboard);

/**
 * Admin & Board Protected Routes
 */
// Application management
router.get('/applications/pending', protect, authorize('admin', 'board'), getPendingApplications);
router.get('/applications', protect, authorize('admin', 'board'), getApplications);
router.get('/applications/:id', protect, authorize('admin', 'board'), getApplicationById);
router.post('/applications/:id/approve', protect, authorize('admin', 'board'), approveApplication);
router.delete('/applications/:id', protect, authorize('admin', 'board'), deleteApplication);

// Member roster & Gamification Points management
router.get('/all', protect, authorize('admin', 'board'), getAllMembers);
router.patch('/:id/points', protect, authorize('admin', 'board'), updateMemberPoints);
router.patch('/:id/proud', protect, authorize('admin', 'board'), toggleProudMember);
router.delete('/:id', protect, authorize('admin', 'board'), deleteMember);

module.exports = router;
