// Global error handler middleware
export const errorHandler = (err, _req, res, _next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
};