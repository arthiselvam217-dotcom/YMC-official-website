const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  registerForEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  deleteRegistration,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Public Routes
 */
// Get all events (defaults to active; pass ?all=true for full list)
router.get('/', getAllEvents);

// Register for an event
router.post('/register', registerForEvent);

// Get single event by ID
router.get('/:id', getEventById);

/**
 * Admin & Board Protected Routes
 */
// Create new event
router.post('/', protect, authorize('admin', 'board'), createEvent);

// Update event details
router.put('/:id', protect, authorize('admin', 'board'), updateEvent);

// Delete event and cascade registrations
router.delete('/:id', protect, authorize('admin', 'board'), deleteEvent);

// Get all registrations for an event
router.get('/:id/registrations', protect, authorize('admin', 'board'), getEventRegistrations);

// Delete a specific registration
router.delete('/registrations/:id', protect, authorize('admin', 'board'), deleteRegistration);

module.exports = router;
