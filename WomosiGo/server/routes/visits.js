const express = require('express');
const Visit = require('../models/Visit');

const router = express.Router();

// POST /api/visits
router.post('/', async (req, res) => {
  try {
    const { salesRep, campsite, plannedAt, notes } = req.body || {};
    if (!salesRep || !campsite) {
      return res.status(400).json({ message: 'salesRep ve campsite zorunludur' });
    }
    const v = await Visit.create({ salesRep, campsite, plannedAt, notes });
    res.status(201).json(v);
  } catch (err) {
    console.error('create visit error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH /api/visits/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['red','yellow','green'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz status' });
    }
    const update = { status };
    const now = new Date();
    if (status === 'yellow') update.startedAt = now;
    if (status === 'green') update.completedAt = now;
    const v = await Visit.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!v) return res.status(404).json({ message: 'Visit bulunamadı' });
    res.json(v);
  } catch (err) {
    console.error('update visit status error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/visits
router.get('/', async (req, res) => {
  try {
    const { salesRep } = req.query;
    const filter = salesRep ? { salesRep } : {};
    const list = await Visit.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json(list);
  } catch (err) {
    console.error('list visits error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
