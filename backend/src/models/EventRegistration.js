const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID reference is required'],
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Attendee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Attendee email is required'],
      lowercase: true,
      trim: true,
    },
    number: {
      type: String,
      required: [true, 'Attendee contact number is required'],
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    rollNo: {
      type: String,
      default: '',
      trim: true,
    },
    yearNo: {
      type: String,
      default: '',
    },
    college: {
      type: String,
      default: 'Government College of Technology',
      trim: true,
    },
    dob: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

eventRegistrationSchema.index({ eventId: 1, email: 1 });

const EventRegistration = mongoose.model('EventRegistration', eventRegistrationSchema);

module.exports = EventRegistration;
