const mongoose = require('mongoose');

const usageCounterSchema = new mongoose.Schema(
  {
    feature: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      default: 'library',
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Atomic increment helper for feature usage counters
 */
usageCounterSchema.statics.increment = async function (feature = 'library') {
  const counter = await this.findOneAndUpdate(
    { feature },
    { $inc: { count: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.count;
};

const UsageCounter = mongoose.model('UsageCounter', usageCounterSchema);

module.exports = UsageCounter;
