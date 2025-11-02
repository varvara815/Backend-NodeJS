# Homework 1: Log Generator & Analyzer

## Description
Two Node.js applications for generating and analyzing logs.

## Project Structure
```
src/
├── logger.js          # Shared Logger class
├── log-generator.js   # Log generator application
└── log-analyzer.js    # Log analyzer application
logs/                  # Logs directory (created automatically)
package.json           # Project configuration
pnpm-lock.yaml         # Dependency lock file
.gitignore             # Git ignore rules
README-hw1.md          # This documentation
README.md              # General project readme
```

## Usage

### Log Generator
```bash
pnpm run generator
```
- Creates a new folder every minute
- Creates a new log file every 10 seconds

### Log Analyzer
```bash
# Show all statistics
pnpm run analyzer

# Filter by type
pnpm run analyzer -- --type=ERROR
pnpm run analyzer -- --type=SUCCESS

# Help
pnpm run analyzer -- --help
```

## Features
- Random log generation (INFO, WARN, ERROR, SUCCESS)
- Analysis of all created logs
- CLI filtering by log type
- Shared Logger class for both applications
- Asynchronous file processing
- Error handling

## Requirements
- Node.js 18+
- pnpm