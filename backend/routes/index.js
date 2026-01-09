import articlesRouter from './articles.js';
import commentsRouter from './comments.js';
import workspacesRouter from './workspaces.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import { authenticateToken } from '../middleware/auth.js';

// Setup all API routes
export const setupRoutes = (app) => {
  app.use('/api/auth', authRouter);             // Auth routes: /api/auth/register, /api/auth/login
  app.use('/api/articles', authenticateToken, articlesRouter);    // Article routes: /api/articles/*
  app.use('/api', authenticateToken, commentsRouter);             // Comment routes: /api/comments/* and /api/articles/:id/comments
  app.use('/api/workspaces', authenticateToken, workspacesRouter); // Workspace routes: /api/workspaces/*
  app.use('/api/users', authenticateToken, usersRouter);           // User routes: /api/users/*
};