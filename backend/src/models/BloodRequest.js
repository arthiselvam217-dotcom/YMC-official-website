const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    attenderName: {
      type: String,
      required: [true, 'Attender / contact person name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    number: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Required blood group is required'],
      enum: {
        values: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        message: '{VALUE} is not a valid blood group',
      },
    },
    bloodUnits: {
      type: Number,
      required: [true, 'Number of units is required'],
      min: [1, 'Must request at least 1 unit'],
      default: 1,
    },
    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Hospital address / location is required'],
      trim: true,
    },
    canAffordTravel: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['open', 'fulfilled', 'cancelled'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

bloodRequestSchema.index({ status: 1, createdAt: -1 });
bloodRequestSchema.index({ bloodGroup: 1 });

const BloodRequest = mongoose.model('BloodRequest', bloodRequestSchema);

module.exports = BloodRequest;
