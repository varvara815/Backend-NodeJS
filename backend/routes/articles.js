import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validateArticle, validateId } from '../validators.js';
import { 
  getAllArticles, 
  readArticle, 
  writeArticle, 
  deleteArticle, 
  articleExists 
} from '../fileStorage.js';

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
      title: title.trim(),
      content: content.trim(),
      createdAt: existingArticle.createdAt,
      updatedAt: new Date().toISOString()
    };

    await writeArticle(id, updatedArticle);
    res.json({ id, message: 'Article updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating article' });
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