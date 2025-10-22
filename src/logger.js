import fs from 'fs';
import fsPromises from 'fs/promises';

// Shared Logger class used by both applications
export class Logger {
  constructor(baseDir = 'logs') {
    this.baseDir = baseDir;
    // Create base directory if it doesn't exist
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  // Write log entry to specified file (async)
  async writeLog(level, message, filePath) {
    try {
      // Create timestamp in ISO format
      const timestamp = new Date().toISOString();
      // Format log entry: timestamp [LEVEL] message
      const logEntry = `${timestamp} [${level}] ${message}\n`;
      // Append to file (create if doesn't exist)
      await fsPromises.appendFile(filePath, logEntry);
    } catch (error) {
      console.error(`Error writing log to ${filePath}: ${error.message}`);
    }
  }

  // Parse log line and extract level (shared parsing logic)
  parseLogLine(line) {
    // Use regex to properly parse log format: timestamp [LEVEL] message
    const logRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[([A-Z]+)\] .+$/;
    const match = line.match(logRegex);
    return match ? match[1] : null; // Return level or null if invalid
  }
}
