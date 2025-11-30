import { MAX_TITLE_LENGTH, MAX_CONTENT_LENGTH } from './constants.js';

// Validate article title and content
export const validateArticle = (title, content) => {
  const errors = [];
  if (!title || !title.trim()) {
    errors.push('Title is required');
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
  }
  if (!content || !content.trim()) {
    errors.push('Content is required');
  } else if (content.length > MAX_CONTENT_LENGTH) {
    errors.push(`Content must be less than ${MAX_CONTENT_LENGTH} characters`);
  }
  return errors;
};

// Validate UUID format
export const validateId = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
};
