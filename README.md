# Articles Management System

A full-stack application for managing articles with a Vue.js frontend and Node.js backend.

## Features

### Authentication & Security
- **User registration** with email and password validation
- **JWT-based authentication** for secure login sessions
- **Role-based access control (RBAC)** - Users have roles: admin or user
- **Protected routes** - Logic page accessible only with valid JWT
- **Automatic token validation** and expiration handling
- **Secure password storage** with bcrypt hashing
- **Session management** - automatic logout on token expiration

### Articles Management
- **Full CRUD operations** for articles (Create, Read, Update, Delete)
- **Permission-based editing** - Only article creator or admin can edit/delete
- View list of articles (sorted by creation date)
- Read individual articles with HTML content (XSS protected)
- Create new articles with WYSIWYG editor
- Edit existing articles with WYSIWYG editor
- Delete articles with confirmation
- **File attachments** - Upload and attach files to articles (JPG, PNG, GIF, PDF)
- **Article Search** - Find articles by matching text in title or content (case-insensitive, minimum 1 character search, debounced for performance).

### Comments System
- **Full CRUD operations** for comments (Create, Read, Update, Delete)
- Add comments to articles
- Edit comments inline
- Delete comments with confirmation
- Comments displayed with timestamp

### Workspaces
- Articles organized in workspaces
- Filter articles by workspace
- Display workspace information in article list

### User Management (Admin Only)
- **View all users** - Admins can see list of all registered users
- **Manage user roles** - Admins can change user roles (admin/user)
- **Protected access** - Only admins can access User Management page
- **Role enforcement** - Backend validates admin permissions on all endpoints

### Real-time & Security
- **Real-time notifications** - WebSocket notifications for article updates
- PostgreSQL database storage for all data
- Input validation and error handling
- Responsive design
- File type validation

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

**Note**: This will automatically install `sequelize-cli` as a dev dependency for database migrations.

### 3. Setup database
```bash
cd backend
pnpm run setup
```

This will apply migrations and populate sample data.

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

**Default login credentials:**
- Email: `admin@example.com`
- Password: `password123`

**To make a user admin:**
```bash
# Edit backend/make-admin.js to set the email, then run:
cd backend
node make-admin.js
# Then the user must logout and login again to get new JWT token with admin role
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (email, password) - returns user with role='user'
- `POST /api/auth/login` - Login user (returns JWT token with role)
- `GET /api/auth/verify` - Verify JWT token (requires JWT)

### Users (Admin Only)
- `GET /api/users` - Get all users with their roles (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)

### Articles
- `GET /api/articles` - Get all articles (sorted by creation date, supports ?workspace_id filter)
- `GET /api/articles/:id` - Get specific article by ID (includes comments)
- `POST /api/articles` - Create new article (requires JWT)
- `PUT /api/articles/:id` - Update existing article (only creator or admin)
- `DELETE /api/articles/:id` - Delete article (only creator or admin)
- `POST /api/articles/:id/attachments` - Upload file attachment to article
- `DELETE /api/articles/:id/attachments/:filename` - Delete file attachment
- `POST /api/articles/:id/notify-update` - Send WebSocket notification for article update

### Comments
- `GET /api/articles/:articleId/comments` - Get all comments for an article
- `POST /api/articles/:articleId/comments` - Create new comment
- `PUT /api/comments/:id` - Update existing comment
- `DELETE /api/comments/:id` - Delete comment

### Workspaces
- `GET /api/workspaces` - Get all workspaces

### WebSocket
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

**Users Table:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | User email (unique) |
| password | VARCHAR(255) | Hashed password |
| role | ENUM('admin', 'user') | User role (default: 'user') |
| createdAt | TIMESTAMP | Registration timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

**Articles Table:**

| Column | Type | Description | Example |
|--------|------|-------------|----------|
| id | UUID | Primary key | `39f39454-077e-4dea-9173-b6c226d94341` |
| title | VARCHAR(200) | Article title | `"My First Article"` |
| content | TEXT | Article content (HTML) | `"<p>Hello world</p>"` |
| attachments | JSON | Array of file attachments | `[{"filename":"doc.pdf","originalName":"document.pdf","size":12345}]` |
| user_id | UUID | Foreign key to users | `39f39454-077e-4dea-9173-b6c226d94341` |
| workspace_id | UUID | Foreign key to workspaces (nullable) | `39f39454-077e-4dea-9173-b6c226d94341` |
| createdAt | TIMESTAMP | Creation timestamp | `2025-11-22 13:47:58.519+03` |
| updatedAt | TIMESTAMP | Last update timestamp | `2025-11-22 13:47:58.519+03` |

**Comments Table:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content | TEXT | Comment content |
| article_id | UUID | Foreign key to articles |
| user_id | UUID | Foreign key to users |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

**Workspaces Table:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Workspace name |
| description | TEXT | Workspace description (nullable) |
| createdAt | TIMESTAMP | Creation timestamp |
| updatedAt | TIMESTAMP | Last update timestamp |

## Project Structure

```
├── backend/
│   ├── config/
│   │   ├── config.cjs     # Sequelize CLI configuration
│   │   ├── database.js    # Database connection
│   │   └── paths.js       # Path constants
│   ├── models/
│   │   ├── Article.js     # Sequelize Article model
│   │   ├── Comment.js     # Sequelize Comment model
│   │   ├── User.js        # Sequelize User model
│   │   ├── Workspace.js   # Sequelize Workspace model
│   │   └── index.js       # Model associations
│   ├── routes/
│   │   ├── articles.js    # Article API routes
│   │   ├── auth.js        # Authentication API routes
│   │   ├── comments.js    # Comment API routes
│   │   ├── users.js       # User management API routes (admin only)
│   │   ├── workspaces.js  # Workspace API routes
│   │   └── index.js       # Route configuration
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication & RBAC (Role-Based Access Control) middleware
│   │   └── errorHandler.js  # Error handling middleware
│   ├── services/
│   │   ├── articleService.js    # Article business logic
│   │   ├── databaseService.js   # Database connection
│   │   ├── fileService.js       # File upload handling
│   │   └── websocketService.js  # WebSocket notifications
│   ├── migrations/        # Database migration files
│   ├── seeders/           # Database seed files
│   ├── make-admin.js      # Script to make user admin
│   ├── server.js          # Main server file
│   ├── validators.js      # Input validation
│   ├── constants.js       # Constants (roles, limits, etc.)
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── api/
│   │   │   ├── auth.js      # Authentication API calls
│   │   │   ├── storage.js   # localStorage management
│   │   │   └── index.js     # Axios configuration
│   │   ├── constants.js   # Constants (roles, API config)
│   │   ├── App.vue        # Main app component
│   │   └── main.js        # Entry point
│   ├── index.html
│   └── vite.config.js
└── uploads/               # Uploaded file attachments
```

## Technologies Used

- **Frontend**: Vue.js 3, Quill.js WYSIWYG editor, Axios, Vite, DOMPurify
- **Backend**: Node.js, Express.js, CORS, Multer, WebSockets, JWT, bcrypt
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens, bcrypt password hashing
- **Storage**: PostgreSQL database for articles, file system for uploads
- **Real-time**: WebSocket connections for live notifications
- **Security**: File type validation
- **Package Manager**: pnpm