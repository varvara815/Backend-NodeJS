import express from 'express';

import { articleService } from '../services/articleService.js';
import { articleVersionService } from '../services/articleVersionService.js';
import { fileService } from '../services/fileService.js';
import { websocketService } from '../services/websocketService.js';

const router = express.Router();

// GET /api/articles - Get all articles (sorted by creation date)
router.get('/', async (req, res) => {
  try {
    const articles = await articleService.getArticles(req.query);
    res.json(articles);
  } catch (error) {
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error fetching articles:`,
      error.message
    );
    res.status(500).json({ error: 'Error fetching articles' });
  }
});

// GET /api/articles/:id - Get single article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error fetching article:`,
      error.message
    );
    res.status(500).json({ error: 'Error fetching article' });
  }
});

// POST /api/articles - Create new article
router.post('/', async (req, res) => {
  try {
    const article = await articleService.createArticle(req.body);
    res
      .status(201)
      .json({ id: article.id, message: 'Article created successfully' });
  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('validation')
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error creating article:`,
      error.message
    );
    res.status(500).json({ error: 'Error creating article' });
  }
});

// PUT /api/articles/:id - Update article
router.put('/:id', async (req, res) => {
  try {
    const article = await articleService.updateArticle(req.params.id, req.body);
    websocketService.broadcast(req.wss, {
      type: 'article-updated',
      articleId: req.params.id,
      title: req.body.title?.trim(),
    });
    res.json({ id: req.params.id, message: 'Article updated successfully' });
  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('validation')
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error updating article:`,
      error.message
    );
    res.status(500).json({ error: 'Error updating article' });
  }
});

// POST /api/articles/:id/attachments - Upload file attachment
router.post(
  '/:id/attachments',
  fileService.ensureUploadsDir,
  fileService.upload.single('file'),
  async (req, res) => {
    try {
      await articleService.addAttachment(req.params.id, req.file);
      const article = await articleService.getArticleById(req.params.id);

      res.json({ message: 'File uploaded', attachments: article.attachments });
    } catch (error) {
      if (
        error.message.includes('not found') ||
        error.message.includes('Invalid file')
      ) {
        return res.status(400).json({ error: error.message });
      }
      console.error(
        `[ERROR] ${new Date().toISOString()}: Upload failed:`,
        error.message
      );
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

// DELETE /api/articles/:id/attachments/:filename - Delete file attachment
router.delete('/:id/attachments/:filename', async (req, res) => {
  try {
    await articleService.deleteAttachment(req.params.id, req.params.filename);
    const article = await articleService.getArticleById(req.params.id);
    res.json({ message: 'File deleted', attachments: article.attachments });
  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('Invalid filename')
    ) {
      return res.status(400).json({ error: error.message });
    }
    console.error(
      `[ERROR] ${new Date().toISOString()}: Delete failed:`,
      error.message
    );
    res.status(500).json({ error: 'Delete failed' });
  }
});

// POST /api/articles/:id/notify-update - Send WebSocket notification
router.post('/:id/notify-update', async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    websocketService.broadcast(req.wss, {
      type: 'article-updated',
      articleId: req.params.id,
      title: req.body.title,
    });
    res.json({ message: 'Notification sent' });
  } catch (error) {
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error sending notification:`,
      error.message
    );
    res.status(500).json({ error: 'Error sending notification' });
  }
});

// GET /api/articles/:id/versions - Get all versions of an article
router.get('/:id/versions', async (req, res) => {
  try {
    const versions = await articleVersionService.getArticleVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error fetching article versions:`,
      error.message
    );
    res.status(500).json({ error: 'Error fetching article versions' });
  }
});

// GET /api/articles/:id/versions/:version - Get specific version of an article
router.get('/:id/versions/:version', async (req, res) => {
  try {
    const version = await articleVersionService.getArticleVersion(
      req.params.id,
      parseInt(req.params.version)
    );
    res.json(version);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error fetching article version:`,
      error.message
    );
    res.status(500).json({ error: 'Error fetching article version' });
  }
});

// DELETE /api/articles/:id - Delete article and its files
router.delete('/:id', async (req, res) => {
  try {
    await articleService.deleteArticle(req.params.id);
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    console.error(
      `[ERROR] ${new Date().toISOString()}: Error deleting article:`,
      error.message
    );
    res.status(500).json({ error: 'Error deleting article' });
  }
});

export default router;
