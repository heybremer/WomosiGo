require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI env missing');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);

  const defaults = [
    {
      role: 'admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Passw0rd!',
      fullName: 'Admin User',
    },
    {
      role: 'admin',
      email: process.env.SEED_ADMIN2_EMAIL || 'admin2@example.com',
      password: process.env.SEED_ADMIN2_PASSWORD || 'Passw0rd!',
      fullName: 'Admin Two',
    },
    {
      role: 'business',
      email: process.env.SEED_BUSINESS_EMAIL || 'business@example.com',
      password: process.env.SEED_BUSINESS_PASSWORD || 'Passw0rd!',
      businessName: 'Demo Business',
    },
    {
      role: 'user',
      email: process.env.SEED_USER_EMAIL || 'user@example.com',
      password: process.env.SEED_USER_PASSWORD || 'Passw0rd!',
      fullName: 'Demo User',
    },
  ];

  for (const d of defaults) {
    const passwordHash = await bcrypt.hash(d.password, 10);
    const update = {
      role: d.role,
      email: d.email,
      passwordHash,
      fullName: d.fullName || undefined,
      businessName: d.businessName || undefined,
    };
    const acc = await Account.findOneAndUpdate(
      { email: d.email },
      { $set: update },
      { upsert: true, new: true }
    );
    const token = jwt.sign({ sub: acc._id, role: acc.role, email: acc.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30d' });
    console.log(`[${acc.role}] ${acc.email} / ${d.password}`);
    console.log(`token: ${token}\n`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



