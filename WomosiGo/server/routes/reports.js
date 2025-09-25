const express = require('express');
const Report = require('../models/Report');

const router = express.Router();

// POST /api/reports
router.post('/', async (req, res) => {
  try {
    const { visit, contactName, notes, photoUrl } = req.body || {};
    if (!visit) return res.status(400).json({ message: 'visit zorunludur' });
    const r = await Report.create({ visit, contactName, notes, photoUrl });
    res.status(201).json(r);
  } catch (err) {
    console.error('create report error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { visit } = req.query;
    const filter = visit ? { visit } : {};
    const list = await Report.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(list);
  } catch (err) {
    console.error('list reports error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
