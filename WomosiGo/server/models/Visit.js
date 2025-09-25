const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesRep', required: true, index: true },
    campsite: { type: mongoose.Schema.Types.ObjectId, ref: 'Campsite', required: true, index: true },
    status: { type: String, enum: ['red','yellow','green'], default: 'red', index: true },
    plannedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Visit', visitSchema);
