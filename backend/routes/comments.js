import express from 'express';
import { Comment, Article } from '../models/index.js';

import { MAX_COMMENTS_PER_ARTICLE } from '../constants.js';

const router = express.Router();

// GET /api/articles/:articleId/comments - Get all comments for an article
router.get('/articles/:articleId/comments', async (req, res) => {
    try {
      const { limit = MAX_COMMENTS_PER_ARTICLE, offset = 0 } = req.query;
      const comments = await Comment.findAll({
        where: { article_id: req.params.articleId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching comments' });
    }
  }
);

// POST /api/articles/:articleId/comments - Create new comment
router.post('/articles/:articleId/comments', async (req, res) => {
    try {
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      // Check if article exists
      const article = await Article.findByPk(req.params.articleId);
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const comment = await Comment.create({
        content: content.trim(),
        article_id: req.params.articleId,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Error creating comment' });
    }
  }
);

// GET /api/comments/:id - Get single comment by ID
router.get('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Error fetching comment' });
  }
});

// PUT /api/comments/:id - Update existing comment
router.put('/comments/:id', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await comment.update({ content: content.trim() });

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Error updating comment' });
  }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await comment.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

export default router;
