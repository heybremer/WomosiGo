const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');

const router = express.Router();

function signToken(acc) {
  return jwt.sign({ sub: acc._id, role: acc.role, email: acc.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '14d' });
}

router.post('/register', async (req, res) => {
  try {
    const { role = 'user', fullName, businessName, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email ve password zorunludur' });
    if (!['user','business','admin'].includes(role)) return res.status(400).json({ message: 'Geçersiz rol' });
    const exists = await Account.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Bu e-posta kullanılmakta' });
    const passwordHash = await bcrypt.hash(password, 10);
    const acc = await Account.create({ role, fullName, businessName, email, passwordHash });
    const token = signToken(acc);
    res.status(201).json({ token, account: { id: acc._id, role: acc.role, fullName: acc.fullName, businessName: acc.businessName, email: acc.email } });
  } catch (err) {
    console.error('register account error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const acc = await Account.findOne({ email });
    if (!acc) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    const ok = await bcrypt.compare(password, acc.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    const token = signToken(acc);
    res.json({ token, account: { id: acc._id, role: acc.role, fullName: acc.fullName, businessName: acc.businessName, email: acc.email } });
  } catch (err) {
    console.error('login account error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;


