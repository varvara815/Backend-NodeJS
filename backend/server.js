import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import articlesRouter from './routes/articles.js';
import sequelize from './config/database.js';
import { UPLOADS_DIR } from './config/paths.js';

const app = express();
const PORT = 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use((req, res, next) => {
  req.wss = wss;
  next();
});

app.use('/api/articles', articlesRouter);

app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.message);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  if (err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

try {
  await sequelize.authenticate();
  console.log('Database connection successful!');
} catch (error) {
  console.error('Database connection failed:', error.message);
  process.exit(1);
}

try {
  await fs.access(UPLOADS_DIR);
} catch {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  console.log(`Created uploads directory: ${UPLOADS_DIR}`);
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
