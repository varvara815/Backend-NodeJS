import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { validateArticle } from '../validators.js';
import Article from '../models/Article.js';
import { validateIdMiddleware } from '../middleware/validateId.js';
import { UPLOADS_DIR } from '../config/paths.js';

// Ensure uploads directory exists before file upload
const ensureUploadsDir = async (req, res, next) => {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    console.log(`Created uploads directory: ${UPLOADS_DIR}`);
  }
  next();
};

// Fix filename encoding for non-Latin characters (e.g., Cyrillic)
const fixEncoding = (filename) => {
  try {
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch {
    return filename;
  }
};

// Remove unsafe characters from filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
};

// Configure file storage: where and how to save uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const originalName = fixEncoding(file.originalname);
    const safeName = sanitizeFilename(originalName);
    // Add timestamp to prevent filename conflicts
    cb(null, `${Date.now()}-${safeName}`);
  }
});

// Configure multer: file validation and size limits
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const allowedExts = /\.(jpg|jpeg|png|gif|pdf)$/i;
    const originalName = fixEncoding(file.originalname);
    if (allowedMimes.includes(file.mimetype) && allowedExts.test(originalName)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF allowed'), false); // Reject file
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Send WebSocket message to all connected clients
const broadcast = (wss, message) => {
  if (!wss) return;
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // 1 = OPEN
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error(`[ERROR] ${new Date().toISOString()}: WebSocket send failed:`, error.message);
      }
    }
  });
};

const router = express.Router();

// GET /api/articles - Get all articles (sorted by creation date)
router.get('/', async (req, res) => {
  try {
    const articles = await Article.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(articles);
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error fetching articles:`, error.message);
    res.status(500).json({ error: 'Error fetching articles' });
  }
});

// GET /api/articles/:id - Get single article by ID
router.get('/:id', validateIdMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error fetching article:`, error.message);
    res.status(500).json({ error: 'Error fetching article' });
  }
});

// POST /api/articles - Create new article
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    const errors = validateArticle(title, content);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const article = await Article.create({
      title: title.trim(),
      content: content.trim()
    });

    res.status(201).json({ id: article.id, message: 'Article created successfully' });
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error creating article:`, error.message);
    res.status(500).json({ error: 'Error creating article' });
  }
});

// PUT /api/articles/:id - Update article
router.put('/:id', validateIdMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const errors = validateArticle(title, content);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await article.update({
      title: title.trim(),
      content: content.trim()
    });

    broadcast(req.wss, { type: 'article-updated', articleId: id, title: title.trim() });
    res.json({ id, message: 'Article updated successfully' });
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error updating article:`, error.message);
    res.status(500).json({ error: 'Error updating article' });
  }
});

// POST /api/articles/:id/attachments - Upload file attachment
router.post('/:id/attachments', validateIdMiddleware, ensureUploadsDir, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, and PDF allowed' });
    }
    
    const originalName = fixEncoding(req.file.originalname);
    const attachment = { filename: req.file.filename, originalName, size: req.file.size };
    const currentAttachments = article.attachments || [];
    
    await article.update({
      attachments: [...currentAttachments, attachment]
    });
    
    res.json({ message: 'File uploaded', attachment });
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Upload failed:`, error.message);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE /api/articles/:id/attachments/:filename - Delete file attachment
router.delete('/:id/attachments/:filename', validateIdMiddleware, async (req, res) => {
  try {
    const { id, filename } = req.params;
    
    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    const currentAttachments = article.attachments || [];
    const attachment = currentAttachments.find(a => a.filename === filename);
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const updatedAttachments = currentAttachments.filter(a => a.filename !== filename);
    
    try {
      await fs.unlink(path.join(UPLOADS_DIR, filename));
      await article.update({ attachments: updatedAttachments });
      res.status(204).send();
    } catch (error) {
      console.error(`[ERROR] ${new Date().toISOString()}: Failed to delete file ${filename}:`, error.message);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Delete failed:`, error.message);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// POST /api/articles/:id/notify-update - Send WebSocket notification
router.post('/:id/notify-update', validateIdMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    broadcast(req.wss, { type: 'article-updated', articleId: id, title: title });
    res.json({ message: 'Notification sent' });
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error sending notification:`, error.message);
    res.status(500).json({ error: 'Error sending notification' });
  }
});

// DELETE /api/articles/:id - Delete article and its files
router.delete('/:id', validateIdMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Delete all associated files from disk
    const attachments = article.attachments || [];
    for (const attachment of attachments) {
      try {
        await fs.unlink(path.join(UPLOADS_DIR, attachment.filename));
      } catch (error) {
        console.error(`[ERROR] ${new Date().toISOString()}: Failed to delete file ${attachment.filename}:`, error.message);
      }
    }

    await article.destroy();
    res.status(204).send();
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error deleting article:`, error.message);
    res.status(500).json({ error: 'Error deleting article' });
  }
});

export default router;