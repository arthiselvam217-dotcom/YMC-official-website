const mongoose = require('mongoose');

const libraryResourceSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      required: [true, 'Year of study is required'],
      enum: ['1', '2', '3', '4'],
    },
    dept: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['CSE', 'ECE', 'IT', 'EEE', 'EIE', 'MECH', 'CIVIL', 'PROD', 'IBT'],
    },
    course: {
      type: String,
      required: [true, 'Course / Subject name is required'],
      trim: true,
    },
    bookLink: {
      type: String,
      required: [true, 'Study material / book link is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying syllabus/materials by year and department
libraryResourceSchema.index({ year: 1, dept: 1 });

const LibraryResource = mongoose.model('LibraryResource', libraryResourceSchema);

module.exports = LibraryResource;
