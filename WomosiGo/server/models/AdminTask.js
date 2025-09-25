const mongoose = require('mongoose');

const AdminTaskSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    googlePlaceId: { type: String, required: true, index: true },
    name: { type: String },
    address: { type: String },
    photoRef: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
    status: { type: String, enum: ['added', 'in_progress', 'positive', 'negative'], default: 'added', index: true },
    notes: { type: String },
    visitAt: { type: Date },
    notesLog: [
      {
        text: { type: String, required: true },
        at: { type: Date, default: Date.now },
      }
    ],
    attachments: [
      {
        fileName: String,
        url: String,
        mimeType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

AdminTaskSchema.index({ adminId: 1, googlePlaceId: 1 }, { unique: true });
AdminTaskSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('AdminTask', AdminTaskSchema);


