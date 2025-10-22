// Log Analyzer - analyzes generated logs and calculates statistics
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Logger } from './logger.js';

// Parse command line arguments
const args = process.argv.slice(2);
let filterType = null;

// Extract filter type from CLI arguments (e.g., --type=ERROR)
args.forEach((arg) => {
  if (arg.startsWith('--type=')) {
    filterType = arg.split('=')[1]?.toUpperCase();
  }
});

// Initialize shared logger for parsing
const logger = new Logger();

// Main function to analyze all log files
async function analyzeAllLogs() {
  const logsDir = 'logs';
  // Check if logs directory exists
  if (!existsSync(logsDir)) {
    console.log('No logs directory found');
    return;
  }

  // Initialize counters for each log level
  const stats = { INFO: 0, WARN: 0, ERROR: 0, SUCCESS: 0 };
  let totalLogs = 0;

  // Recursive function to process directories and files
  async function processDirectory(dir) {
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        try {
          const itemPath = path.join(dir, item);
          const stat = await fs.stat(itemPath);

          // If it's a directory, process it recursively
          if (stat.isDirectory()) {
            await processDirectory(itemPath);
          } else if (item.endsWith('.log')) {
            // Process log files
            const content = await fs.readFile(itemPath, 'utf8');
            const lines = content.split('\n').filter((line) => line.trim());

            // Count each log level using Logger's parsing method
            lines.forEach((line) => {
              const level = logger.parseLogLine(line);
              if (level && stats.hasOwnProperty(level)) {
                stats[level]++;
                totalLogs++;
              }
            });
          }
        } catch (error) {
          console.warn(`Warning: Could not process ${item}: ${error.message}`);
        }
      }
    } catch (error) {
      console.warn(
        `Warning: Could not read directory ${dir}: ${error.message}`
      );
    }
  }

  // Start processing from logs directory
  await processDirectory(logsDir);

  // Display results
  console.log('Log Analysis');
  if (filterType) {
    // Show filtered results if type specified
    console.log(`Filter: ${filterType}`);
    console.log(`${filterType}: ${stats[filterType] || 0}`);
  } else {
    // Show all statistics
    console.log(`INFO: ${stats.INFO}`);
    console.log(`WARN: ${stats.WARN}`);
    console.log(`ERROR: ${stats.ERROR}`);
    console.log(`SUCCESS: ${stats.SUCCESS}`);
    // Calculate total as sum for verification
    const calculatedTotal =
      stats.INFO + stats.WARN + stats.ERROR + stats.SUCCESS;
    console.log(`Total: ${totalLogs} (verified: ${calculatedTotal})`);
  }
}

// Handle CLI arguments
if (args.includes('--help')) {
  console.log(
    'Usage: node log-analyzer.js [--type=INFO|WARN|ERROR|SUCCESS] [--help]'
  );
} else {
  // Validate filter type if provided
  if (
    filterType &&
    !['INFO', 'WARN', 'ERROR', 'SUCCESS'].includes(filterType)
  ) {
    console.error(`Error: Invalid log type '${filterType}'`);
    console.log(
      'Usage: node log-analyzer.js [--type=INFO|WARN|ERROR|SUCCESS] [--help]'
    );
    process.exit(1);
  }

  analyzeAllLogs().catch((error) => {
    console.error('Error analyzing logs:', error.message);
    process.exit(1);
  });
}
