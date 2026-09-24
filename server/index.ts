import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

import { initDatabase } from './db';
import authRouter from './routes/auth';
import scanRouter from './routes/scan';
import ideasRouter from './routes/ideas';
import postsRouter from './routes/posts';
import commentsRouter from './routes/comments';
import ideaHubRouter from './routes/ideaHub';
import businessRouter from './routes/business';
import donationsRouter from './routes/donations';
import notificationsRouter from './routes/notifications';
import searchRouter from './routes/search';
import adminRouter from './routes/admin';
import impactRouter from './routes/impact';
import shoppingRouter from './routes/shopping';

dotenv.config();

// Ensure database schema is up-to-date
initDatabase();

export const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Basic Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/scan', scanRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/discover', postsRouter);
app.use('/api/posts', postsRouter);
app.use('/api', commentsRouter); // handles /api/posts/:id/comments, /api/ai/comment-summary
app.use('/api/idea-hub', ideaHubRouter);
app.use('/api/businesses', businessRouter);
app.use('/api/business', businessRouter); // handles /api/business/ideas and /api/business/help
app.use('/api/donations', donationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/search', searchRouter);
app.use('/api/admin', adminRouter);
app.use('/api/impact', impactRouter);
app.use('/api/shopping', shoppingRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Waste2Worth',
    tagline: "Don't Throw It — Transform It",
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Centralized API Error Handling Middleware
app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Setup Frontend Serving (Vite in Dev, Static in Prod)
export async function startServer() {
  if (!isProd) {
    // Dynamic import for Vite dev middleware so production server doesn't bundle dev tools
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('/waste2worth', express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`♻️  Waste2Worth server running on http://localhost:${PORT}`);
    console.log(`   Tagline: "Don't Throw It — Transform It"`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   AI Provider: ${process.env.AI_PROVIDER || 'mock'}`);
    console.log(`==================================================\n`);
  });

  return server;
}

if (!process.env.VITEST) {
  startServer();
}
