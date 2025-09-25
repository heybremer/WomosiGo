const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('No MONGO_URI / MONGODB_URI provided');
  }
  await mongoose.connect(uri);
  console.log('MongoDB veritabanına başarıyla bağlanıldı.');
};

module.exports = connectDB;
