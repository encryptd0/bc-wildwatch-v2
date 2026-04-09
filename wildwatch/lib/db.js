const mongoose = require('mongoose');

let connectionPromise = null;

async function connectDB() {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) return;

  // If a connection is in progress, wait for it
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wildwatch')
    .then(() => {
      console.log('MongoDB connected');
      connectionPromise = null;
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
}

module.exports = { connectDB };
