import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { UPLOADS_DIR, FILE_SIZE_LIMIT, ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS } from '../constants.js';

export const ensureUploadsDirectory = async () => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log(`Created uploads directory: ${UPLOADS_DIR}`);
  }
};

// Fix filename encoding for non-Latin characters
export const fixEncoding = (filename) => {
  try {
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch {
    return filename;
  }
};


export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const originalName = fixEncoding(file.originalname);
    const safeName = sanitizeFilename(originalName);

    cb(null, `${Date.now()}-${safeName}`);
  }
});


export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const originalName = fixEncoding(file.originalname);
    if (ALLOWED_FILE_TYPES.includes(file.mimetype) && ALLOWED_FILE_EXTENSIONS.test(originalName)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF allowed'), false);
    }
  },
  limits: { fileSize: FILE_SIZE_LIMIT }
});


export const ensureUploadsDir = async (req, res, next) => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log(`Created uploads directory: ${UPLOADS_DIR}`);
  }
  next();
};

export const deleteFile = async (filename) => {
  const resolvedPath = path.resolve(UPLOADS_DIR, filename);
  if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
    throw new Error('Invalid filename');
  }
  
  await fs.unlink(resolvedPath);
};

export const fileService = {
  ensureUploadsDirectory,
  fixEncoding,
  sanitizeFilename,
  upload,
  ensureUploadsDir,
  deleteFile
};