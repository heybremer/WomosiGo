const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SalesRep = require('../models/SalesRep');
const Account = require('../models/Account');

const router = express.Router();

function getRequestIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) {
    return xf.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
}

router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      region,
      countryCode,
      state,
      carBrand,
      carModel,
      carYear,
    } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email ve password zorunludur' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const existingAccount = await Account.findOne({ email: emailNormalized });
    if (existingAccount) {
      return res.status(409).json({ message: 'Bu e-posta ile kullanıcı zaten var' });
    }
    const existingSalesRep = await SalesRep.findOne({ email: emailNormalized });
    if (existingSalesRep) {
      return res.status(409).json({ message: 'Bu e-posta ile kullanıcı zaten var' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const signupIp = getRequestIp(req);
    const account = await Account.create({
      role: 'user',
      fullName: fullName.trim(),
      email: emailNormalized,
      passwordHash,
      phone: phone || undefined,
      countryCode: countryCode || undefined,
      state: state || undefined,
      region: region || undefined,
      carBrand: carBrand || undefined,
      carModel: carModel || undefined,
      carYear: carYear || undefined,
      signupIp: signupIp || undefined,
      status: 'active',
      favorites: [],
    });
    res.status(201).json({ id: account._id, fullName: account.fullName, email: account.email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email ve password zorunludur' });
    }
    // First try SalesRep (eski yapı)
    let rep = await SalesRep.findOne({ email });
    let ok = false;
    if (rep) {
      ok = await bcrypt.compare(password, rep.passwordHash);
      if (!ok) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
      const token = jwt.sign({ sub: rep._id, email: rep.email, role: 'user' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.json({ token, user: { id: rep._id, fullName: rep.fullName, email: rep.email } });
    }

    // Then try Account (role based: admin/business/user)
    const acc = await Account.findOne({ email: email.toLowerCase().trim() });
    if (!acc) return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    ok = await bcrypt.compare(password, acc.passwordHash || '');
    if (!ok) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }
    if (acc.status === 'suspended') {
      return res.status(403).json({ message: 'Hesabınız dondurulmuş. Lütfen destek ekibi ile iletişime geçin.' });
    }
    acc.lastLoginAt = new Date();
    acc.lastLoginIp = getRequestIp(req) || undefined;
    await acc.save({ validateBeforeSave: false });
    const token = jwt.sign({ sub: acc._id, email: acc.email, role: acc.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: acc._id, fullName: acc.fullName, email: acc.email, role: acc.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
