import express from 'express';
import cors from 'cors';
import articlesRouter from './routes/articles.js';
import { initDataDir } from './fileStorage.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/articles', articlesRouter);

await initDataDir();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
