const mongoose = require('mongoose');

const AdminNotificationSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    message: { type: String, required: true },
    audience: { type: String, enum: ['admin', 'user'], default: 'admin', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminNotification', AdminNotificationSchema);


