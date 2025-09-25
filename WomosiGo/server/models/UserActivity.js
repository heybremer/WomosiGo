const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    type: { type: String, enum: ['view','search','directions','call','favorite_add','favorite_remove','premium_approval'], required: true, index: true },
    googlePlaceId: { type: String, index: true },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserActivity', userActivitySchema);


