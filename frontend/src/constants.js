export const EDITOR_OPTIONS = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
    ],
  },
};

// File upload constants
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
];
export const ALLOWED_FILE_EXTENSIONS = /\.(jpg|jpeg|png|gif|pdf)$/i;
export const UPLOADS_BASE_URL =
  import.meta.env.VITE_UPLOADS_URL || 'http://localhost:3001/uploads';

// Authentication constants
export const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
