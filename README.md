# Articles Management System

A full-stack application for managing articles with a Vue.js frontend and Node.js backend.

## Features

- View list of articles (sorted by creation date)
- Read individual articles with HTML content (XSS protected)
- Create new articles with WYSIWYG editor
- **Edit existing articles** with WYSIWYG editor
- **Delete articles** with confirmation
- File-based storage (JSON files)
- Input validation and error handling
- Responsive design
- Security: XSS protection with DOMPurify

## Prerequisites

- Node.js (v16 or higher)
- pnpm (install with: `npm install -g pnpm`)

## Setup & Installation

### Quick Start (Recommended)
```bash
# 1. Install dependencies
pnpm install

# 2. Start backend (in first terminal)
cd backend
pnpm dev

# 3. Start frontend (in second terminal)
cd frontend
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Alternative: Install dependencies separately
```bash
# Install root dependencies first
pnpm install

# Then install backend and frontend dependencies
pnpm run install:all

# Start backend (in first terminal)
cd backend
pnpm dev

# Start frontend (in second terminal)
cd frontend
pnpm dev
```

### Option 3: Detailed Manual Setup
```bash
# 1. Install backend dependencies
cd backend
pnpm install

# 2. Install frontend dependencies
cd ../frontend
pnpm install

# 3. Start backend (in one terminal)
cd backend
pnpm run dev  # Server: http://localhost:3001

# 4. Start frontend (in another terminal)
cd frontend
pnpm run dev  # Frontend: http://localhost:3000
```

## API Endpoints

- `GET /api/articles` - Get all articles (sorted by creation date)
- `GET /api/articles/:id` - Get specific article by ID
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update existing article
- `DELETE /api/articles/:id` - Delete article

## Validation Rules

- **Title**: Required, max 200 characters
- **Content**: Required, max 50,000 characters

## Project Structure

```
├── backend/           # Node.js Express server
│   ├── routes/        # API route handlers
│   │   └── articles.js  # Articles CRUD operations
│   ├── server.js      # Main server file
│   ├── fileStorage.js # File system operations
│   ├── validators.js  # Input validation functions
│   └── package.json   # Backend dependencies
├── frontend/          # Vue.js application
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── constants.js # API configuration
│   │   └── App.vue      # Main app component
│   └── package.json   # Frontend dependencies
├── data/             # Article storage (JSON files)
└── README.md
```

## Technologies Used

- **Frontend**: Vue.js 3, Quill.js WYSIWYG editor, Axios, Vite, DOMPurify
- **Backend**: Node.js, Express.js, CORS, UUID
- **Storage**: File system (JSON files)
- **Security**: DOMPurify for XSS protection
- **Package Manager**: pnpm