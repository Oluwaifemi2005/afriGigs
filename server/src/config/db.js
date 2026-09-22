import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gigafrik');
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Error connecting to database: ${error.message}`);
    console.warn('[MongoDB] Make sure your local MongoDB service is running or provide a valid Atlas MONGO_URI in server/.env');
  }
};
