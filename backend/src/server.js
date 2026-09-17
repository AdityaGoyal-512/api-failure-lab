import app from './app.js';
import connectDatabase from './config/db.js';
import config from './config/env.js';

async function startServer() {
  await connectDatabase();

  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start backend:', error.message);
  process.exit(1);
});
