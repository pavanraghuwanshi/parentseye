const mongoose = require('mongoose');
require('dotenv').config();
const mongoURL = process.env.MONGODB_URL;

// No need for deprecated options
mongoose.connect(mongoURL);

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Connected to MongoDB server');
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

module.exports = db;
