import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

import { UPLOADS_DIR } from './constants.js';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

import { setupRoutes } from './routes/index.js';
import { connectDatabase } from './services/databaseService.js';
import { ensureUploadsDirectory } from './services/fileService.js';
import { setupWebSocketServer } from './services/websocketService.js';

const app = express();
const PORT = 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use((req, res, next) => {
  req.wss = wss;
  next();
});

setupRoutes(app);
app.use(errorHandler);

await connectDatabase();
await ensureUploadsDirectory();
setupWebSocketServer(wss);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
