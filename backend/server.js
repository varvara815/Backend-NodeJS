import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'data');


const validateArticle = (title, content) => {
  const errors = [];
  if (!title || !title.trim()) {
    errors.push('Title is required');
  } else if (title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  if (!content || !content.trim()) {
    errors.push('Content is required');
  } else if (content.length > 50000) {
    errors.push('Content must be less than 50000 characters');
  }
  return errors;
};

const validateId = (id) => {
  return /^[a-zA-Z0-9_-]+$/.test(id);
};


const initDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

const readArticle = async (id) => {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
};

const writeArticle = async (id, article) => {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(article, null, 2));
};

const deleteArticle = async (id) => {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.unlink(filePath);
};

const articleExists = async (id) => {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const getAllArticles = async () => {
  const files = await fs.readdir(DATA_DIR);
  const articles = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        const article = JSON.parse(content);
        articles.push({ 
          id: file.replace('.json', ''), 
          title: article.title, 
          createdAt: article.createdAt 
        });
      } catch {
        continue;
      }
    }
  }
  return articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());


await initDataDir();

app.get('/api/articles', async (req, res) => {
  try {
    const articles = await getAllArticles();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching articles' });
  }
});

app.get('/api/articles/:id', async (req, res) => {
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

app.post('/api/articles', async (req, res) => {
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

app.put('/api/articles/:id', async (req, res) => {
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

app.delete('/api/articles/:id', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
