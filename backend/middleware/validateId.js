import { validateId } from '../validators.js';

export const validateIdMiddleware = (req, res, next) => {
  const { id } = req.params;
  
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid article ID format' });
  }
  
  next();
};