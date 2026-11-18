/**
 * Express application with the DPDPA API mounted at /api/v1.
 * Shared by the local server (server.ts) and the Vercel serverless function (api/index.ts).
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes/api.js';
import { ccdStore } from './ccd-store.js';
import { isMongoEnabled, loadStore, saveStore } from './db.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------------------------------------
// MongoDB persistence: load the CCD before each API request, save changes
// before the response is sent. Requests are serialised so one request's
// load/save cannot interleave with another's.
// ----------------------------------------------------------------------------
let queue: Promise<void> = Promise.resolve();

function persistence(req: Request, res: Response, next: NextFunction) {
  // Long-lived SSE stream and static docs don't touch the database
  if (!isMongoEnabled() || req.path.startsWith('/events/stream') || req.path === '/openapi.json') {
    return next();
  }

  let release!: () => void;
  const turn = new Promise<void>((r) => (release = r));
  const waitFor = queue;
  queue = queue.then(() => turn);

  let released = false;
  const done = () => {
    if (!released) {
      released = true;
      release();
    }
  };
  res.on('finish', done);
  res.on('close', done);

  waitFor
    .then(() => loadStore(ccdStore as any))
    .then(() => {
      // Save before the body is sent (serverless functions may freeze afterwards)
      const originalSend = res.send.bind(res);
      let saving = false;
      res.send = ((body?: any) => {
        if (saving) return originalSend(body);
        saving = true;
        saveStore(ccdStore as any)
          .then(() => originalSend(body))
          .catch((err) => {
            console.error('[mongo] save failed:', err);
            res.status(500);
            originalSend(JSON.stringify({ error: 'DATABASE_WRITE_FAILED', message: err.message }));
          });
        return res;
      }) as any;
      next();
    })
    .catch((err) => {
      console.error('[mongo] load failed:', err);
      done();
      res.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: err.message });
    });
}

app.use('/api/v1', persistence, apiRouter);

export default app;
