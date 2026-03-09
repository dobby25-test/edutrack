import DOMPurify from 'dompurify';

// ✅ SECURITY FIX: Strip all HTML/script content from free-text inputs.
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
};

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
};

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const value = typeof password === 'string' ? password : '';
  const errors = [];

  if (value.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(value)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(value)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(value)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.push('Password must contain at least one special character');

  return {
    isValid: errors.length === 0,
    errors
  };
};
