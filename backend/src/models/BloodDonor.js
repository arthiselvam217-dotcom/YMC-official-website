const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
    },
    number: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        message: '{VALUE} is not a supported blood group',
      },
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Primary location / city is required'],
      trim: true,
    },
    moreLocation: {
      type: String,
      default: '',
      trim: true,
    },
    receiveMail: {
      type: Boolean,
      default: true,
    },
    showOnSearch: {
      type: Boolean,
      default: true,
    },
    uniqueId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast donor search by blood group and location
bloodDonorSchema.index({ bloodGroup: 1, location: 1, showOnSearch: 1 });
bloodDonorSchema.index({ email: 1 });

const BloodDonor = mongoose.model('BloodDonor', bloodDonorSchema);

module.exports = BloodDonor;
