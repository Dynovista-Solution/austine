const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection using Mongoose
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/austine';
    await mongoose.connect(uri, {
      // options can be added here if needed
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };