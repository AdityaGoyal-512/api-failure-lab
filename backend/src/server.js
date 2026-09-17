import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';
import connectDatabase from './config/db.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDirectory, '../../.env') });

const port = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start backend:', error.message);
  process.exit(1);
});
