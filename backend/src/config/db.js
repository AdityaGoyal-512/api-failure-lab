import mongoose from 'mongoose';
import config from './env.js';

async function connectDatabase() {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI is required. Set it in the environment.');
  }

  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB Atlas');
}

export default connectDatabase;
