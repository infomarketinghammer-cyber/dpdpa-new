/**
 * Vercel serverless function: every /api/* request is routed here (see vercel.json)
 * and handled by the shared Express app.
 */

import app from '../server/app.js';

export default app;
