const { Event, EventRegistration } = require('../models');

/**
 * @desc    Get all active events
 * @route   GET /api/events
 * @access  Public
 */
const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ isActive: true }).sort({ date: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register for an event
 * @route   POST /api/events/register
 * @access  Public
 */
const registerForEvent = async (req, res, next) => {
  try {
    const {
      eventId,
      name,
      email,
      number,
      department,
      rollNo,
      yearNo,
      college,
      dob,
      location,
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if attendee is already registered for this event
    const existing = await EventRegistration.findOne({
      eventId,
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already registered for this event with this email address.',
      });
    }

    const registration = await EventRegistration.create({
      eventId,
      eventName: event.title,
      name,
      email: email.toLowerCase().trim(),
      number,
      department: department || '',
      rollNo: rollNo || '',
      yearNo: yearNo || '',
      college: college || 'Government College of Technology',
      dob: dob || '',
      location: location || '',
    });

    res.status(201).json({
      success: true,
      message: `Registered successfully for "${event.title}". We look forward to seeing you!`,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private (Admin & Board)
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, link, venue, date, bannerImage } = req.body;

    const event = await Event.create({
      title,
      description,
      link: link || '',
      venue: venue || 'Government College of Technology, Coimbatore',
      date: date ? new Date(date) : null,
      bannerImage: bannerImage || '',
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update existing event
 * @route   PUT /api/events/:id
 * @access  Private (Admin & Board)
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Admin & Board)
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Clean up attendee registrations for deleted event
    await EventRegistration.deleteMany({ eventId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Event and associated registrations deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registrations for a specific event
 * @route   GET /api/events/:id/registrations
 * @access  Private (Admin & Board)
 */
const getEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await EventRegistration.find({ eventId: req.params.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  registerForEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
};
