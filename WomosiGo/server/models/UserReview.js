const mongoose = require('mongoose');

const userReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    googlePlaceId: { type: String, required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserReview', userReviewSchema);


