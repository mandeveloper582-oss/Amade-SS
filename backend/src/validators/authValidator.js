const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters long.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Phone number must be 30 characters or fewer.'),
  body('acceptedTerms').custom((value) => value === true).withMessage('You must accept the terms and conditions.'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must include an uppercase letter, a lowercase letter, and a number.'),
];

const loginValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must include an uppercase letter, a lowercase letter, and a number.'),
];

module.exports = { registerValidator, loginValidator, changePasswordValidator };
