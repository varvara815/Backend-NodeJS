import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { validateArticle, validateId } from '../validators.js';
import { 
  getAllArticles, 
  readArticle, 
  writeArticle, 
  deleteArticle, 
  articleExists 
} from '../fileStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

const fixEncoding = (filename) => {
  try {
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch {
    return filename;
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const originalName = fixEncoding(file.originalname);
    cb(null, `${Date.now()}-${originalName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const allowedExts = /\.(jpg|jpeg|png|gif|pdf)$/i;
    const originalName = fixEncoding(file.originalname);
    if (allowedMimes.includes(file.mimetype) && allowedExts.test(originalName)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and PDF allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const broadcast = (wss, message) => {
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify(message));
  });
};

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const articles = await getAllArticles();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching articles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validateId(id)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }
    
    const article = await readArticle(id);
    res.json({ id, ...article });
  } catch (error) {
    res.status(404).json({ error: 'Article not found' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    const errors = validateArticle(title, content);
    
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    const id = uuidv4();
    const article = { 
      title: title.trim(), 
      content: content.trim(), 
      createdAt: new Date().toISOString() 
    };

    await writeArticle(id, article);
    res.status(201).json({ id, message: 'Article created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating article' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!validateId(id)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    const errors = validateArticle(title, content);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0] });
    }

    if (!(await articleExists(id))) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existingArticle = await readArticle(id);
    const updatedArticle = {
      ...existingArticle,
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString()
    };

    await writeArticle(id, updatedArticle);
    broadcast(req.wss, { type: 'article-updated', articleId: id, title: title.trim() });
    res.json({ id, message: 'Article updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating article' });
  }
});

router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id) || !(await articleExists(id))) {
      return res.status(404).json({ error: 'Article not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Invalid file type. Only JPG, PNG, GIF, and PDF allowed' });
    }
    const article = await readArticle(id);
    const originalName = fixEncoding(req.file.originalname);
    const attachment = { filename: req.file.filename, originalName, size: req.file.size };
    article.attachments = [...(article.attachments || []), attachment];
    await writeArticle(id, article);
    res.json({ message: 'File uploaded', attachment });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.delete('/:id/attachments/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    if (!validateId(id) || !(await articleExists(id))) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const article = await readArticle(id);
    article.attachments = (article.attachments || []).filter(a => a.filename !== filename);
    await writeArticle(id, article);
    await fs.unlink(path.join(UPLOADS_DIR, filename)).catch(() => {});
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

router.post('/:id/notify-update', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!validateId(id)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    if (!(await articleExists(id))) {
      return res.status(404).json({ error: 'Article not found' });
    }

    broadcast(req.wss, { type: 'article-updated', articleId: id, title: title });
    res.json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: 'Error sending notification' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateId(id)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }

    if (!(await articleExists(id))) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await deleteArticle(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting article' });
  }
});

export default router;