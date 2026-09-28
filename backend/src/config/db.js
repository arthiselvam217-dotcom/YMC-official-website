const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Reads URI strictly from environment variable MONGO_URI
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI || mongoURI.includes('<username>')) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '⚠️  [MongoDB Warning]: MONGO_URI is not set or contains placeholder credentials in .env.'
      );
      console.warn(
        '\x1b[33m%s\x1b[0m',
        '   Please set a valid MongoDB Atlas connection string in backend/.env to persist data.'
      );
      return;
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(
      '\x1b[32m%s\x1b[0m',
      `✅ [MongoDB Connected]: ${conn.connection.host} / ${conn.connection.name}`
    );
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ [MongoDB Connection Error]: ${error.message}`);
    // Do not exit process in development to allow server testing
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
