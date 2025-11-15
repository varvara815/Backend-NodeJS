import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

export const initDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

export const readArticle = async (id) => {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
};

export const writeArticle = async (id, article) => {
  await initDataDir();
  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(article, null, 2));
};

export const deleteArticle = async (id) => {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  await fs.unlink(filePath);
};

export const articleExists = async (id) => {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getAllArticles = async () => {
  await initDataDir();
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