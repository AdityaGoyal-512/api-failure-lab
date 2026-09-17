import mongoose from 'mongoose';

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required. Set it in the environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
}

export default connectDatabase;

