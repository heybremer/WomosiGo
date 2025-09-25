const mongoose = require('mongoose');

const campsiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    googlePlaceId: { type: String, index: true },
    photoRef: { type: String },
    rating: { type: Number },
    userRatingsTotal: { type: Number },
    qrCodeId: { type: String, index: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: '2dsphere',
      },
    },
    promoted: { type: Boolean, default: false, index: true },
    promotedAt: { type: Date },
    promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campsite', campsiteSchema);
// Ensure index exists
try {
  campsiteSchema.index({ location: '2dsphere' });
} catch (_) {}
