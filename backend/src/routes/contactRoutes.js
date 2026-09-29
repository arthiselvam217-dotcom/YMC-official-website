const express = require('express');
const router = express.Router();
const {
  submitContactMessage,
  getContactInfo,
} = require('../controllers/contactController');

// Public: Get club contact information
router.get('/', getContactInfo);

// Public: Submit contact inquiry message
router.post('/', submitContactMessage);

module.exports = router;
