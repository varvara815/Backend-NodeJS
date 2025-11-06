export const validateArticle = (title, content) => {
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

export const validateId = (id) => {
  return /^[a-zA-Z0-9_-]+$/.test(id);
};