require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const accountsRoutes = require('./routes/accounts');
const campsiteRoutes = require('./routes/campsites');
const visitRoutes = require('./routes/visits');
const reportRoutes = require('./routes/reports');
const userDataRoutes = require('./routes/userdata');
const businessRoutes = require('./routes/business');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();

const allowedOrigins = (process.env.WEB_ORIGIN || 'http://localhost:5174,http://127.0.0.1:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed for this origin'));
    },
    credentials: false,
  })
);
app.use(express.json());

const port = Number(process.env.PORT) || 5001;
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI; // Opsiyonel: tanımlı değilse bağlanma

// API rotaları
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/campsites', campsiteRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/user', userDataRoutes);
app.use('/api/business', businessRoutes);
// Public config for frontend (exposes only safe keys)
app.get('/api/config', (req, res) => {
  res.json({
    // Only expose browser key to the client
    googleMapsApiKey: process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });
});
app.use('/api/admin', adminRoutes);
// Serve uploads
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600');
  next();
}, require('express').static(path.join(__dirname, 'uploads')));

// Basit sağlık kontrolü: Mongo durumu da dönülsün
app.get('/health', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1; // 1: connected
  res.json({ status: 'ok', mongo: mongoReady ? 'connected' : 'not_connected' });
});

// Sunucuyu Mongo durumundan bağımsız başlat
app.listen(port, () => {
  console.log('Server listening on port ' + port);
});

// Mongo bağlantısını arka planda dene; geçersiz placeholder varsa atla
if (mongoUri) {
  const hasPlaceholders = /<kullanici|<sifre|xxxxx/.test(mongoUri);
  if (hasPlaceholders) {
    console.log('MONGO_URI placeholder içeriyor. Geçerli bir bağlantı dizesi sağlayana kadar bağlantı atlanıyor.');
  } else {
    (async () => {
      try {
        await connectDB();
      } catch (err) {
        console.warn('MongoDB connection failed:', err && err.message ? err.message : err);
      }
    })();
  }
} else {
  console.log('No MONGO_URI provided. Skipping MongoDB connection.');
}

// Nazik kapanış
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
  } catch (_) {}
  process.exit(0);
});
