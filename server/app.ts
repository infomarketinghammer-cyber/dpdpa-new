/**
 * Express application with the DPDPA API mounted at /api/v1.
 * Shared by the local server (server.ts) and the Vercel serverless function (api/index.ts).
 */

import express from 'express';
import { apiRouter } from './routes/api.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', apiRouter);

export default app;
