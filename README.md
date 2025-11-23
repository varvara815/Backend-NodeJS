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
- PostgreSQL (v12 or higher)

## Setup & Installation

### 1. Setup PostgreSQL Database

**Create database:**

Open pgAdmin or run in terminal:
```bash
psql -U postgres
```

Then execute:
```sql
CREATE DATABASE articles_db;
\q
```

**Configure environment variables:**

Copy the example environment file and configure it:
```bash
cd backend
# On Linux/Mac:
cp .env.example .env
# On Windows:
copy .env.example .env
```

Then edit `backend/.env` and set your PostgreSQL password:
```env
DB_PASSWORD=your_postgres_password
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Run database migration
```bash
cd backend
pnpm run migrate
```

You should see:
```
Database connection successful!
Tables created successfully!
Migration completed!
```

### 4. Start the application

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

## Database Schema

**Articles Table:**

| Column | Type | Description | Example |
|--------|------|-------------|----------|
| id | UUID | Primary key | `39f39454-077e-4dea-9173-b6c226d94341` |
| title | VARCHAR(200) | Article title | `"My First Article"` |
| content | TEXT | Article content (HTML) | `"<p>Hello world</p>"` |
| attachments | JSON | Array of file attachments | `[{"filename":"doc.pdf","originalName":"document.pdf","size":12345}]` |
| createdAt | TIMESTAMP | Creation timestamp | `2025-11-22 13:47:58.519+03` |
| updatedAt | TIMESTAMP | Last update timestamp | `2025-11-22 13:47:58.519+03` |

## Project Structure

```
├── backend/
│   ├── config/
│   │   ├── database.js    # Database configuration
│   │   └── paths.js       # Path constants
│   ├── models/
│   │   └── Article.js     # Sequelize Article model
│   ├── routes/
│   │   └── articles.js    # API route handlers
│   ├── middleware/
│   │   └── validateId.js  # ID validation middleware
│   ├── server.js          # Main server file
│   ├── migrate.js         # Database migration script
│   ├── validators.js      # Input validation
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── constants.js   # API configuration
│   │   ├── App.vue        # Main app component
│   │   └── main.js        # Entry point
│   ├── index.html
│   └── vite.config.js
└── uploads/               # Uploaded file attachments
```

## Technologies Used

- **Frontend**: Vue.js 3, Quill.js WYSIWYG editor, Axios, Vite, DOMPurify
- **Backend**: Node.js, Express.js, CORS, Multer, WebSockets
- **Database**: PostgreSQL with Sequelize ORM
- **Storage**: PostgreSQL database for articles, file system for uploads
- **Real-time**: WebSocket connections for live notifications
- **Security**: DOMPurify for XSS protection, File type validation
- **Package Manager**: pnpm