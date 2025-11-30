import path from 'path';
import { fileURLToPath } from 'url';

// ES module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File upload constants
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];
export const ALLOWED_FILE_EXTENSIONS = /\.(jpg|jpeg|png|gif|pdf)$/i;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_COMMENTS_PER_ARTICLE = 50;

// Validation constants
export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 50000;

// Paths
export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// WebSocket constants
export const WS_READY_STATE_OPEN = 1;
