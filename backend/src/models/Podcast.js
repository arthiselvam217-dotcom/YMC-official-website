const mongoose = require('mongoose');

const podcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Podcast title is required'],
      trim: true,
    },
    link: {
      type: String,
      required: [true, 'Podcast link is required'],
      trim: true,
    },
    coverImage: {
      type: String,
      default: '/media/podlogo.jpeg',
    },
  },
  {
    timestamps: true,
  }
);

const Podcast = mongoose.model('Podcast', podcastSchema);

module.exports = Podcast;
