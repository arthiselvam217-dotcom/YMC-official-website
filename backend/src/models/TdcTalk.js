const mongoose = require('mongoose');

const tdcTalkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Talk title is required'],
      trim: true,
    },
    speaker: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
    },
    link: {
      type: String,
      required: [true, 'Talk video/recording link is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

tdcTalkSchema.index({ year: -1 });

const TdcTalk = mongoose.model('TdcTalk', tdcTalkSchema);

module.exports = TdcTalk;
