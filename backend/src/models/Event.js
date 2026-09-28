const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    bannerImage: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
    },
    venue: {
      type: String,
      default: 'Government College of Technology, Coimbatore',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ isActive: 1, createdAt: -1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
