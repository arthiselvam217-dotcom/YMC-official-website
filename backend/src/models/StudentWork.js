const mongoose = require('mongoose');

const studentWorkSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Content type is required'],
      enum: ['article', 'poem', 'microtale', 'blog', 'cocurricular'],
    },
    category: {
      type: String,
      enum: [
        'None',
        'Photography',
        'Music',
        'Dance',
        'Arts/Crafts',
        'Speech',
        'Animations',
        'Others',
      ],
      default: 'None',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Author email is required'],
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Work content is required'],
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    attachments: [
      {
        type: String, // File paths or media URLs
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['published', 'pending', 'archived'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

studentWorkSchema.index({ type: 1, category: 1, createdAt: -1 });
studentWorkSchema.index({ email: 1 });

const StudentWork = mongoose.model('StudentWork', studentWorkSchema);

module.exports = StudentWork;
