const mongoose = require('mongoose');

const electiveResourceSchema = new mongoose.Schema(
  {
    dept: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Elective course name is required'],
      trim: true,
    },
    bookLink: {
      type: String,
      required: [true, 'Resource / book link is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Elective category is required'],
      enum: ['Open Elective', 'Professional Elective'],
    },
  },
  {
    timestamps: true,
  }
);

electiveResourceSchema.index({ category: 1, dept: 1 });

const ElectiveResource = mongoose.model('ElectiveResource', electiveResourceSchema);

module.exports = ElectiveResource;
