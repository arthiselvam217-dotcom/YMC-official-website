const express = require('express');
const router = express.Router();
const {
  loginUser,
  logoutUser,
  getMe,
  completeRegistration,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Public Auth Routes
 */
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/register-member', completeRegistration);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

/**
 * Protected Auth Routes
 */
router.get('/me', protect, getMe);

module.exports = router;
