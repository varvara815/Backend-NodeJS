import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import User from '../models/User.js';
import { ROLES } from '../constants.js';

const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (![ROLES.ADMIN, ROLES.USER].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user.userId) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ role });
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user role' });
  }
});

export default router;