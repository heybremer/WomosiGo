const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user','business','admin'], required: true, index: true },
    fullName: { type: String, trim: true },
    businessName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true },
    state: { type: String, trim: true },
    region: { type: String, trim: true },
    carBrand: { type: String, trim: true },
    carModel: { type: String, trim: true },
    carYear: { type: String, trim: true },
    signupIp: { type: String, trim: true },
    lastLoginIp: { type: String, trim: true },
    lastLoginAt: { type: Date },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
    favorites: [{ type: String }], // googlePlaceId list
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', accountSchema);


