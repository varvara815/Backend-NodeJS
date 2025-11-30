import express from 'express';
import { Workspace } from '../models/index.js';

const router = express.Router();

// GET /api/workspaces - Get all workspaces (read-only)
router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.findAll({
      order: [['createdAt', 'ASC']]
    });
    res.json(workspaces);
  } catch (error) {
    console.error(`[ERROR] ${new Date().toISOString()}: Error fetching workspaces:`, error.message);
    res.status(500).json({ error: 'Error fetching workspaces' });
  }
});

export default router;