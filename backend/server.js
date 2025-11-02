import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(process.cwd(), '..', 'data');

app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);
app.use(express.json());

// Create data folder if it doesn't exist
try {
  await fs.access(DATA_DIR);
} catch {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

app.get('/api/articles', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const articles = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
          const article = JSON.parse(content);
          articles.push({ id: file.replace('.json', ''), title: article.title, createdAt: article.createdAt });
        } catch (error) {
          // Skip corrupted files
          continue;
        }
      }
    }

    // Sort by creation date (newest first)
    articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching articles' });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent path traversal attacks
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid article ID' });
    }
    
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const article = JSON.parse(content);

    res.json({ id, ...article });
  } catch (error) {
    res.status(404).json({ error: 'Article not found' });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be less than 200 characters' });
    }
    
    if (content.length > 50000) {
      return res.status(400).json({ error: 'Content must be less than 50000 characters' });
    }

    const id = uuidv4();
    const article = { 
      title: title.trim(), 
      content: content.trim(), 
      createdAt: new Date().toISOString() 
    };
    const filePath = path.join(DATA_DIR, `${id}.json`);

    await fs.writeFile(filePath, JSON.stringify(article, null, 2));

    res.status(201).json({ id, message: 'Article created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating article' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
