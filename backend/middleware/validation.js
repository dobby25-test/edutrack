const { body, param, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  return next();
};

// ✅ SECURITY FIX: Reject malformed auth payloads before controller logic.
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .trim()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8 to 128 characters'),
  validate
];

const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8 to 128 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be 2-100 characters'),
  validate
];

// ✅ SECURITY FIX: Validate and sanitize project creation input.
const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be 3-200 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters')
    .escape(),
  body('requirements')
    .optional()
    .trim()
    .isLength({ max: 4000 })
    .withMessage('Requirements must be less than 4000 characters')
    .escape(),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject must be at most 100 characters')
    .escape(),
  body('maxMarks')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max marks must be between 1 and 1000'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  validate
];

const validateAssignmentSubmit = [
  param('assignmentId')
    .isInt({ min: 1 })
    .withMessage('Invalid assignment id'),
  body('codeContent')
    .trim()
    .isLength({ min: 1, max: 50000 })
    .withMessage('Code content is required and must be <= 50000 characters'),
  body('studentComments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments must be <= 2000 characters')
    .escape(),
  body('language')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Invalid language value')
    .escape(),
  validate
];

module.exports = {
  validateLogin,
  validateRegistration,
  validateProject,
  validateAssignmentSubmit,
  validate
};
