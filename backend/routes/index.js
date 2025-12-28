import articlesRouter from './articles.js';
import commentsRouter from './comments.js';
import workspacesRouter from './workspaces.js';
import authRouter from './auth.js';
import { authenticateToken } from '../middleware/auth.js';

// Setup all API routes
export const setupRoutes = (app) => {
  app.use('/api/auth', authRouter);             // Auth routes: /api/auth/register, /api/auth/login
  app.use('/api/articles', authenticateToken, articlesRouter);    // Article routes: /api/articles/*
  app.use('/api', authenticateToken, commentsRouter);             // Comment routes: /api/comments/* and /api/articles/:id/comments
  app.use('/api/workspaces', authenticateToken, workspacesRouter); // Workspace routes: /api/workspaces/*
};