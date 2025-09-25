const express = require('express');
const jwt = require('jsonwebtoken');
const UserActivity = require('../models/UserActivity');
const Reservation = require('../models/Reservation');

const router = express.Router();

function authBusiness(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.role !== 'business' && payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.user = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// GET /api/business/analytics?googlePlaceId=...
router.get('/analytics', authBusiness, async (req, res) => {
  try {
    const googlePlaceId = (req.query.googlePlaceId || '').toString();
    if (!googlePlaceId) return res.status(400).json({ message: 'googlePlaceId zorunludur' });
    const views = await UserActivity.countDocuments({ googlePlaceId, type: 'view' });
    const searches = await UserActivity.countDocuments({ googlePlaceId, type: 'search' });
    const directions = await UserActivity.countDocuments({ googlePlaceId, type: 'directions' });
    const calls = await UserActivity.countDocuments({ googlePlaceId, type: 'call' });
    const reservations = await Reservation.countDocuments({ googlePlaceId });
    res.json({ views, searches, directions, calls, reservations });
  } catch (err) {
    console.error('business analytics error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/business/reservations
router.get('/reservations', authBusiness, async (req, res) => {
  try {
    const googlePlaceId = (req.query.googlePlaceId || '').toString();
    const filter = googlePlaceId ? { googlePlaceId } : {};
    const list = await Reservation.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(list);
  } catch (err) {
    console.error('business reservations error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/business/reservations/:id { status }
router.patch('/reservations/:id', authBusiness, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['approved','declined','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Geçersiz durum' });
    const r = await Reservation.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!r) return res.status(404).json({ message: 'Rezervasyon bulunamadı' });
    res.json(r);
  } catch (err) {
    console.error('business reservation patch error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


