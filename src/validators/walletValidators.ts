import { body, query } from 'express-validator';

export const fundValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description').optional().isString().isLength({ max: 500 }),
];

export const withdrawValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description').optional().isString().isLength({ max: 500 }),
];

export const transferValidation = [
  body('recipientUserId')
    .isUUID()
    .withMessage('Valid recipient user ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description').optional().isString().isLength({ max: 500 }),
];

export const transactionsQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

