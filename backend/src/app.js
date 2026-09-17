import cors from 'cors';
import express from 'express';
import healthRouter from './routes/health.routes.js';
import apiV1Router from './routes/api-v1.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import config from './config/env.js';

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use('/health', healthRouter);
app.use('/api/v1', apiV1Router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
