import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import animeRoutes from './routes/anime.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import libraryRoutes from './routes/library.js';
import customListsRoutes from './routes/customLists.js';
import preferencesRoutes from './routes/preferences.js';
import recommendationsRoutes from './routes/recommendations.js';
import { authenticate, validateCsrf } from './middleware/auth.js';

export function createApp(): Application {
  const app = express();

  // CORS configuration for cookie-authenticated sessions
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.APP_URL,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, or same-origin SSR)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Dev-friendly fallback
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(cookieParser());
  app.use(express.json());

  // Session resolution middleware (attaches req.user & req.session if valid cookie exists)
  app.use(authenticate);

  // CSRF validation for state-changing requests using cookie sessions
  app.use(validateCsrf);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'anisume-api',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/lists', customListsRoutes);
  app.use('/api/preferences', preferencesRoutes);
  app.use('/api/recommendations', recommendationsRoutes);
  app.use('/api/anime', animeRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API Error]', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  return app;
}

export default createApp;
