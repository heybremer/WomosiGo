const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true, index: true },
    contactName: { type: String, trim: true },
    notes: { type: String },
    photoUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
