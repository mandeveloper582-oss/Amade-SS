const { body } = require('express-validator');

const updateProfileValidator = [
  body().custom((value) => {
    const allowedFields = new Set(['name', 'phone', 'avatar']);
    if (!value || Object.keys(value).some((field) => !allowedFields.has(field))) {
      throw new Error('Only name, phone, and avatar may be updated.');
    }
    if (Object.keys(value).length === 0) {
      throw new Error('Provide at least one profile field to update.');
    }
    return true;
  }),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters long.'),
  body('phone').optional().trim().isLength({ max: 30 }).withMessage('Phone number must be 30 characters or fewer.'),
  body('avatar').optional().isURL({ require_protocol: true }).withMessage('Avatar must be a valid URL.'),
];

module.exports = { updateProfileValidator };
