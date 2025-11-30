import { WS_READY_STATE_OPEN } from '../constants.js';

// Setup WebSocket server connection handlers
export const setupWebSocketServer = (wss) => {
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    ws.on('close', () => console.log('WebSocket client disconnected'));
  });
};

// Send WebSocket message to all connected clients
export const broadcast = (wss, message) => {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === WS_READY_STATE_OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error(`[ERROR] ${new Date().toISOString()}: WebSocket send failed:`, error.message);
      }
    }
  });
};

export const websocketService = {
  setupWebSocketServer,
  broadcast
};