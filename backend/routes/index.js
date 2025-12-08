import articlesRouter from './articles.js';
import commentsRouter from './comments.js';
import workspacesRouter from './workspaces.js';

// Setup all API routes
export const setupRoutes = (app) => {
  app.use('/api/articles', articlesRouter);    // Article routes: /api/articles/*
  app.use('/api', commentsRouter);             // Comment routes: /api/comments/* and /api/articles/:id/comments
  app.use('/api/workspaces', workspacesRouter); // Workspace routes: /api/workspaces/*
};