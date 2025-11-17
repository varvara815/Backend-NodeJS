import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import articlesRouter from './routes/articles.js';
import { initDataDir } from './fileStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

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

await initDataDir();
try {
  await fs.access(UPLOADS_DIR);
} catch {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
