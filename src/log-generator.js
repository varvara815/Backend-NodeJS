// Log Generator - creates folders every minute and log files every 10 seconds
import { Logger } from './logger.js';
import fs from 'fs';
import path from 'path';

// Initialize shared logger instance
const logger = new Logger();
let currentFolder = '';

// Create new folder every minute
function createNewFolder() {
  try {
    // Generate timestamp for folder name (replace invalid chars)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    currentFolder = path.join('logs', `folder-${timestamp}`);
    // Create folder if it doesn't exist
    if (!fs.existsSync(currentFolder)) {
      fs.mkdirSync(currentFolder, { recursive: true });
    }
    console.log(`Created folder: ${currentFolder}`);
  } catch (error) {
    console.error(`Error creating folder: ${error.message}`);
  }
}

// Generate log file every 10 seconds
async function generateLogFile() {
  // Ensure we have a current folder
  if (!currentFolder) createNewFolder();

  // Generate unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `log-${timestamp}.log`;
  const filePath = path.join(currentFolder, fileName);

  // Available log levels and sample messages
  const levels = ['INFO', 'WARN', 'ERROR', 'SUCCESS'];
  const messages = [
    'User login',
    'Database connection',
    'File processed',
    'Request timeout',
  ];

  // Generate 3 random log entries per file
  for (let i = 0; i < 3; i++) {
    // Randomly select level and message
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    // Write log entry using shared logger (async)
    await logger.writeLog(level, message, filePath);
  }

  console.log(`Created log file: ${filePath}`);
}

// Set up timers: folder every 60s, file every 10s
setInterval(createNewFolder, 60000);  // 60000ms = 1 minute
setInterval(generateLogFile, 10000);  // 10000ms = 10 seconds

// Create initial folder and first log file immediately
createNewFolder();
generateLogFile(); // Create first file immediately
console.log('Log generator started...');
