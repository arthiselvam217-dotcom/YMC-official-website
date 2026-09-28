const mongoose = require('mongoose');

const memberApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    rollNo: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    yearNo: {
      type: String,
      required: [true, 'Year of study is required'],
      enum: ['1', '2', '3', '4'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    mobileNo: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    socialMedia: {
      type: String,
      default: '',
      trim: true,
    },
    linkedId: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    dob: {
      type: String,
      required: [true, 'Date of birth is required'],
    },
    question1: {
      type: String,
      required: [true, 'Screening question 1 is required'],
    },
    question2: {
      type: String,
      required: [true, 'Screening question 2 is required'],
    },
    question3: {
      type: String,
      required: [true, 'Screening question 3 is required'],
    },
    status: {
      type: Boolean,
      default: false, // false = pending review, true = approved
    },
    /**
     * Member Identification:
     * - New applicants will be assigned official YMC IDs (e.g., YMC2025001)
     * - Historical/migrated records can retain their legacy YSC IDs (e.g., YSC2021004)
     */
    userId: {
      type: String,
      default: 'NoId',
      trim: true,
    },
    joined: {
      type: Boolean,
      default: false, // true once user completes account registration
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching and filtering applications
memberApplicationSchema.index({ email: 1 });
memberApplicationSchema.index({ status: 1 });
memberApplicationSchema.index({ userId: 1 });

/**
 * Static method to generate next official YMC Member ID
 * Format: YMC{year_no}{zero_padded_number} (e.g., YMC2001)
 */
memberApplicationSchema.statics.generateYmcId = async function (yearNo) {
  const count = await this.countDocuments();
  const sequence = count + 1;
  const padded = String(sequence).padStart(3, '0');
  return `YMC${yearNo}${padded}`;
};

const MemberApplication = mongoose.model('MemberApplication', memberApplicationSchema);

module.exports = MemberApplication;
