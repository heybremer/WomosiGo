const express = require('express');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const UserReview = require('../models/UserReview');
const Reservation = require('../models/Reservation');
const UserActivity = require('../models/UserActivity');

const router = express.Router();

function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return next();
  } catch (_) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

async function getOrEnsureAccount(userPayload) {
  // Try by id
  let acc = await Account.findById(userPayload.sub).lean();
  if (acc) return acc;
  // Try by email
  if (userPayload?.email) {
    acc = await Account.findOne({ email: userPayload.email }).lean();
    if (acc) return acc;
    // Create a lightweight user account if none exists yet
    const created = await Account.create({ email: userPayload.email, role: 'user', favorites: [] });
    return created.toObject();
  }
  return null;
}

// GET /api/user/me: favorites, last activities, my reviews, my reservations
router.get('/me', auth, async (req, res) => {
  try {
    const acc = await getOrEnsureAccount(req.user);
    const activities = await UserActivity.find({ user: req.user.sub }).sort({ createdAt: -1 }).limit(50).lean();
    const reviews = await UserReview.find({ user: req.user.sub }).sort({ createdAt: -1 }).limit(50).lean();
    const reservations = await Reservation.find({ user: req.user.sub }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ account: { id: acc?._id, email: acc?.email, role: acc?.role, favorites: acc?.favorites || [] }, activities, reviews, reservations });
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/user/favorites/toggle { googlePlaceId }
router.post('/favorites/toggle', auth, async (req, res) => {
  try {
    const { googlePlaceId } = req.body || {};
    if (!googlePlaceId) return res.status(400).json({ message: 'googlePlaceId zorunludur' });
    let acc = await Account.findById(req.user.sub);
    if (!acc) {
      // Fallback by email and create if missing
      if (req.user?.email) {
        acc = await Account.findOne({ email: req.user.email });
        if (!acc) acc = await Account.create({ email: req.user.email, role: 'user', favorites: [] });
      }
    }
    if (!acc) return res.status(404).json({ message: 'Hesap bulunamadı' });
    acc.favorites = acc.favorites || [];
    const ix = acc.favorites.indexOf(googlePlaceId);
    if (ix >= 0) acc.favorites.splice(ix, 1); else acc.favorites.push(googlePlaceId);
    await acc.save();
    res.json({ favorites: acc.favorites });
  } catch (err) {
    console.error('favorites toggle error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/user/reviews
router.post('/reviews', auth, async (req, res) => {
  try {
    const { googlePlaceId, rating, text } = req.body || {};
    if (!googlePlaceId || !rating) return res.status(400).json({ message: 'googlePlaceId ve rating zorunludur' });
    const r = await UserReview.create({ user: req.user.sub, googlePlaceId, rating, text });
    res.status(201).json(r);
  } catch (err) {
    console.error('create user review error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/user/reservations
router.post('/reservations', auth, async (req, res) => {
  try {
    const { googlePlaceId, date, notes, business } = req.body || {};
    if (!googlePlaceId) return res.status(400).json({ message: 'googlePlaceId zorunludur' });
    const r = await Reservation.create({ user: req.user.sub, business: business || undefined, googlePlaceId, date, notes });
    res.status(201).json(r);
  } catch (err) {
    console.error('create reservation error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/user/activities
router.post('/activities', auth, async (req, res) => {
  try {
    const { type, googlePlaceId, meta } = req.body || {};
    const ok = ['view','search','directions','call','favorite_add','favorite_remove','premium_approval'].includes(type);
    if (!ok) return res.status(400).json({ message: 'Geçersiz activity type' });
    const a = await UserActivity.create({ user: req.user.sub, type, googlePlaceId, meta });
    res.status(201).json(a);
  } catch (err) {
    console.error('create activity error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


