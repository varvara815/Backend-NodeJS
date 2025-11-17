# Articles Management System

A full-stack application for managing articles with a Vue.js frontend and Node.js backend.

## Features

- View list of articles (sorted by creation date)
- Read individual articles with HTML content (XSS protected)
- Create new articles with WYSIWYG editor
- **Edit existing articles** with WYSIWYG editor
- **Delete articles** with confirmation
- **File attachments** - Upload and attach files to articles (JPG, PNG, GIF, PDF)
- **Real-time notifications** - WebSocket notifications for article updates
- File-based storage (JSON files)
- Input validation and error handling
- Responsive design
- Security: XSS protection with DOMPurify, file type validation

## Prerequisites

- Node.js (v16 or higher)
- pnpm (install with: `npm install -g pnpm`)

## Setup & Installation

### 1. Install dependencies
```bash
pnpm install
```

### 2. Start the application

**Option A: Start everything at once**
```bash
pnpm dev
```

**Option B: Start separately (recommended for development)**
```bash
# Terminal 1 - Backend
pnpm run dev:backend

# Terminal 2 - Frontend  
pnpm run dev:frontend
```

**Option C: Manual start**
```bash
# Terminal 1
cd backend
pnpm dev

# Terminal 2
cd frontend
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

- `GET /api/articles` - Get all articles (sorted by creation date)
- `GET /api/articles/:id` - Get specific article by ID
- `POST /api/articles` - Create new article
- `PUT /api/articles/:id` - Update existing article
- `DELETE /api/articles/:id` - Delete article
- `POST /api/articles/:id/attachments` - Upload file attachment to article
- `DELETE /api/articles/:id/attachments/:filename` - Delete file attachment
- `POST /api/articles/:id/notify-update` - Send WebSocket notification for article update
- `WebSocket ws://localhost:3001` - Real-time notifications for article changes

## New Features

### File Attachments
- Upload and attach files (JPG, PNG, GIF, PDF, max 10MB)
- Files displayed at the top of article pages
- Click to view/download, delete while editing

### Real-Time Notifications
- WebSocket notifications for article updates (text or file changes)
- Users control when to refresh content
- Multiple notification types: yellow banner, success message, global toast

## Validation Rules

- **Title**: Required, max 200 characters
- **Content**: Required, max 50,000 characters
- **File attachments**: JPG, PNG, GIF, PDF only, max 10MB per file

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
├── uploads/          # Uploaded file attachments
└── README.md
```

## Technologies Used

- **Frontend**: Vue.js 3, Quill.js WYSIWYG editor, Axios, Vite, DOMPurify
- **Backend**: Node.js, Express.js, CORS, UUID, Multer, WebSockets
- **Storage**: File system (JSON files), File uploads
- **Real-time**: WebSocket connections for live notifications
- **Security**: DOMPurify for XSS protection, File type validation
- **Package Manager**: pnpm