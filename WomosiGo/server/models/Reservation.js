const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: false, index: true },
    googlePlaceId: { type: String, required: true, index: true },
    date: { type: Date, required: false },
    notes: { type: String },
    status: { type: String, enum: ['pending','approved','declined','cancelled'], default: 'pending', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reservation', reservationSchema);


