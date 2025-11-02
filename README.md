# Articles Management System

A full-stack application for managing articles with a Vue.js frontend and Node.js backend.

## Features

- View list of articles (sorted by creation date)
- Read individual articles with HTML content (XSS protected)
- Create new articles with WYSIWYG editor
- File-based storage (JSON files)
- Input validation and error handling
- Responsive design
- Security: XSS protection with DOMPurify

## Setup & Installation

### Quick Start (Recommended)
```bash
# Install all dependencies
pnpm install

# Start both frontend and backend
pnpm start
```

### Manual Setup
```bash
# Backend
cd backend
pnpm install
pnpm run dev  # Server: http://localhost:3001

# Frontend (in new terminal)
cd frontend
pnpm install
pnpm run dev  # Frontend: http://localhost:3000
```

## API Endpoints

- `GET /api/articles` - Get all articles (sorted by creation date)
- `GET /api/articles/:id` - Get specific article by ID
- `POST /api/articles` - Create new article

## Validation Rules

- **Title**: Required, max 200 characters
- **Content**: Required, max 50,000 characters

## Project Structure

```
├── backend/           # Node.js Express server
│   ├── server.js      # Main server file
│   └── package.json   # Backend dependencies
├── frontend/          # Vue.js application
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── config/      # API configuration
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