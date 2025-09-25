const express = require('express');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const UserActivity = require('../models/UserActivity');
const Reservation = require('../models/Reservation');
const UserReview = require('../models/UserReview');
const AdminTask = require('../models/AdminTask');
const Campsite = require('../models/Campsite');
const { appendSignatureParam } = require('../utils/googleSign');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AdminNotification = require('../models/AdminNotification');

const router = express.Router();

function authAdmin(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.user = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

router.get('/stats', authAdmin, async (req, res) => {
  try {
    const userCount = await Account.countDocuments({ role: 'user' });
    const businessCount = await Account.countDocuments({ role: 'business' });
    const reviewCount = await UserReview.countDocuments({});
    const reservationCount = await Reservation.countDocuments({});
    const activityCount = await UserActivity.countDocuments({});
    res.json({ userCount, businessCount, reviewCount, reservationCount, activityCount });
  } catch (err) {
    console.error('admin stats error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// List users for admin
router.get('/users', authAdmin, async (req, res) => {
  try {
    const role = (req.query.role || 'user').toString();
    const q = {};
    if (role) q.role = role;
    const users = await Account.find(q)
      .select('_id role fullName businessName email phone countryCode state region carBrand carModel carYear signupIp lastLoginIp lastLoginAt status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (err) {
    console.error('admin users list error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/users/:id', authAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz status' });
    }
    const acc = await Account.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!acc) return res.status(404).json({ message: 'Bulunamadı' });
    res.json({ id: acc._id, status: acc.status });
  } catch (err) {
    console.error('admin user update status error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/users/:id', authAdmin, async (req, res) => {
  try {
    const r = await Account.deleteOne({ _id: req.params.id });
    res.json({ deleted: r.deletedCount === 1 });
  } catch (err) {
    console.error('admin user delete error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/businesses', authAdmin, async (req, res) => {
  try {
    const list = await Campsite.find({ promoted: true }).sort({ promotedAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error('admin businesses list error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

// Tasks: list nearby camps for admin and manage tasks
router.get('/tasks/nearby', authAdmin, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(parseInt(req.query.radius || '5000', 10), 50000);
    if (!isFinite(lat) || !isFinite(lng)) {
      return res.status(400).json({ message: 'lat,lng zorunludur' });
    }
    // Prefer DB Campsite; fallback to Google
    const Campsite = require('../models/Campsite');
    const mongoose = require('mongoose');
    let results = [];
    if (mongoose.connection.readyState === 1) {
      results = await Campsite.find({
        location: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radius } },
      }).limit(50).lean();
    }
    if (!Array.isArray(results) || results.length === 0) {
      // Fallback to Google Places Nearby directly
      const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return res.status(500).json({ message: 'GOOGLE_MAPS_API_KEY eksik' });
      const params = new URLSearchParams({ location: `${lat},${lng}`, radius: String(radius), type: 'campground', keyword: 'campground caravan rv kamp karavan', key: apiKey });
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
      if (process.env.GOOGLE_URL_SIGNING_SECRET) {
        url = appendSignatureParam(url, process.env.GOOGLE_URL_SIGNING_SECRET);
      }
      const resp = await fetch(url);
      const json = await resp.json();
      if (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
        return res.status(502).json({ message: 'Google Places hatası', status: json.status, error_message: json.error_message });
      }
      results = (json.results || []).map((r) => ({
        name: r.name,
        address: r.vicinity || r.formatted_address || '',
        googlePlaceId: r.place_id,
        location: { type: 'Point', coordinates: [r.geometry?.location?.lng, r.geometry?.location?.lat] },
        photoRef: Array.isArray(r.photos) && r.photos[0]?.photo_reference ? r.photos[0].photo_reference : undefined,
        rating: typeof r.rating === 'number' ? r.rating : undefined,
        userRatingsTotal: typeof r.user_ratings_total === 'number' ? r.user_ratings_total : undefined,
        openNow: typeof r.opening_hours?.open_now === 'boolean' ? r.opening_hours.open_now : undefined,
      }));
    }
    res.json(results);
  } catch (err) {
    console.error('admin tasks nearby error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/tasks', authAdmin, async (req, res) => {
  try {
    const list = await AdminTask.find({ adminId: req.user.sub }).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error('admin tasks list error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/tasks/:id', authAdmin, async (req, res) => {
  try {
    const doc = await AdminTask.findOne({ _id: req.params.id, adminId: req.user.sub }).lean();
    if (!doc) return res.status(404).json({ message: 'Bulunamadı' });
    res.json(doc);
  } catch (err) {
    console.error('admin task get error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/tasks', authAdmin, async (req, res) => {
  try {
    const { googlePlaceId, name, address, photoRef, location } = req.body || {};
    if (!googlePlaceId) return res.status(400).json({ message: 'googlePlaceId zorunludur' });
    const doc = await AdminTask.findOneAndUpdate(
      { adminId: req.user.sub, googlePlaceId },
      { $setOnInsert: { adminId: req.user.sub, googlePlaceId }, $set: { name, address, photoRef, location } },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (err) {
    console.error('admin tasks create error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/tasks/:id', authAdmin, async (req, res) => {
  try {
    const { status, notes, visitAt } = req.body || {};
    const allowed = ['added', 'in_progress', 'positive', 'negative'];
    const update = {};
    if (status) {
      if (!allowed.includes(status)) return res.status(400).json({ message: 'Geçersiz status' });
      update.status = status;
    }
    if (typeof notes === 'string') update.notes = notes;
    if (visitAt) {
      const d = new Date(visitAt);
      if (!isNaN(d)) {
        if (d.getTime() < Date.now()) {
          return res.status(400).json({ message: 'Geçmiş tarihe planlama yapamazsınız' });
        }
        update.visitAt = d;
      }
    }
    const doc = await AdminTask.findOneAndUpdate({ _id: req.params.id, adminId: req.user.sub }, { $set: update }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Bulunamadı' });
    if (status === 'positive') {
      try {
        const up = {
          name: doc.name,
          address: doc.address,
          googlePlaceId: doc.googlePlaceId,
          photoRef: doc.photoRef,
          promoted: true,
          promotedAt: new Date(),
          promotedBy: req.user.sub,
        };
        if (doc.location && Array.isArray(doc.location.coordinates) && doc.location.coordinates.length === 2) {
          up.location = { type: 'Point', coordinates: doc.location.coordinates };
        }
        await Campsite.findOneAndUpdate(
          { googlePlaceId: doc.googlePlaceId },
          { $set: up },
          { upsert: true }
        );
        await UserActivity.create({ user: req.user.sub, type: 'premium_approval', googlePlaceId: doc.googlePlaceId, meta: { name: doc.name, status: 'approved' } });
      } catch (err) {
        console.error('promote campsite error', err);
      }
    }
    if (status === 'negative') {
      try {
        await Campsite.findOneAndUpdate(
          { googlePlaceId: doc.googlePlaceId },
          { $set: { promoted: false }, $unset: { promotedAt: '', promotedBy: '' } }
        );
        await UserActivity.create({ user: req.user.sub, type: 'premium_approval', googlePlaceId: doc.googlePlaceId, meta: { name: doc.name, status: 'rejected' } });
      } catch (err) {
        console.error('demote campsite error', err);
      }
    }
    res.json(doc);
  } catch (err) {
    console.error('admin tasks update error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/tasks/:id', authAdmin, async (req, res) => {
  try {
    const r = await AdminTask.deleteOne({ _id: req.params.id, adminId: req.user.sub });
    res.json({ deleted: r.deletedCount === 1 });
  } catch (err) {
    console.error('admin tasks delete error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir); } catch (_) {}
}
const storage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, uploadsDir) },
  filename: function(req, file, cb) {
    const safe = Date.now() + '-' + Math.round(Math.random()*1e9) + '-' + (file.originalname || 'file')
    cb(null, safe)
  }
})
const upload = multer({ storage })

router.post('/tasks/:id/attachments', authAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Dosya zorunludur' })
    const publicUrl = `/uploads/${req.file.filename}`
    const doc = await AdminTask.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.sub },
      { $push: { attachments: { fileName: req.file.originalname, url: publicUrl, mimeType: req.file.mimetype, size: req.file.size } } },
      { new: true }
    )
    if (!doc) return res.status(404).json({ message: 'Bulunamadı' })
    res.json(doc)
  } catch (err) {
    console.error('admin task attach error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Append note (logged with timestamp)
router.post('/tasks/:id/notes', authAdmin, async (req, res) => {
  try {
    const text = (req.body?.text || '').toString().trim();
    if (!text) return res.status(400).json({ message: 'Metin zorunludur' });
    const doc = await AdminTask.findOneAndUpdate(
      { _id: req.params.id, adminId: req.user.sub },
      { $push: { notesLog: { text, at: new Date() } }, $set: { notes: text } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Bulunamadı' });
    res.json(doc);
  } catch (err) {
    console.error('admin task append note error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete attachment
router.delete('/tasks/:id/attachments/:attachmentId', authAdmin, async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const task = await AdminTask.findOne({ _id: id, adminId: req.user.sub }).lean();
    if (!task) return res.status(404).json({ message: 'Bulunamadı' });
    const att = (task.attachments || []).find((a) => String(a._id) === String(attachmentId));
    if (att && att.url && att.url.startsWith('/uploads/')) {
      try {
        const abs = path.join(__dirname, '..', att.url.replace(/^\//, ''));
        fs.unlink(abs, () => {});
      } catch (_) {}
    }
    const doc = await AdminTask.findOneAndUpdate(
      { _id: id, adminId: req.user.sub },
      { $pull: { attachments: { _id: attachmentId } } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Bulunamadı' });
    res.json(doc);
  } catch (err) {
    console.error('admin task delete attachment error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Notifications CRUD
router.get('/notifications', authAdmin, async (req, res) => {
  try {
    const audience = (req.query.audience || '').toString().trim()
    const q = { adminId: req.user.sub }
    if (audience === 'admin' || audience === 'user') q.audience = audience
    const list = await AdminNotification.find(q).sort({ createdAt: -1 }).lean()
    res.json(list)
  } catch (err) {
    console.error('notifications list error', err)
    res.status(500).json({ message: 'Internal server error' })
  }
});

router.post('/notifications', authAdmin, async (req, res) => {
  try {
    const message = (req.body?.message || '').toString().trim()
    if (!message) return res.status(400).json({ message: 'Mesaj zorunludur' })
    const audience = (req.body?.audience || 'admin').toString()
    const doc = await AdminNotification.create({ adminId: req.user.sub, message, audience: (audience === 'user' ? 'user' : 'admin') })
    // Try sending browser notification to current admin session (best-effort)
    res.json(doc)
  } catch (err) {
    console.error('notifications create error', err)
    res.status(500).json({ message: 'Internal server error' })
  }
});

router.delete('/notifications/:id', authAdmin, async (req, res) => {
  try {
    const r = await AdminNotification.deleteOne({ _id: req.params.id, adminId: req.user.sub })
    res.json({ deleted: r.deletedCount === 1 })
  } catch (err) {
    console.error('notifications delete error', err)
    res.status(500).json({ message: 'Internal server error' })
  }
});

// Delete a specific note from notesLog
router.delete('/tasks/:id/notes/:noteId', authAdmin, async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const doc = await AdminTask.findOneAndUpdate(
      { _id: id, adminId: req.user.sub },
      { $pull: { notesLog: { _id: noteId } } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Bulunamadı' });
    res.json(doc);
  } catch (err) {
    console.error('admin task delete note error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


