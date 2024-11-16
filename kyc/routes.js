const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../Auth/middleware');
const kycRequestController = require('./controller');
const roleMiddlewares = require('../Role/middleware');
const PERMISSIONS = require('../constants/permissions');

const router = express.Router();

// POST route for creating a new KYC request
router.post(
  '/create',
  [
    body('status')
        .optional()
        .isString()
        .withMessage('Status must be a string')
        .isIn(['Pending', 'In Progress', 'Completed', 'Rejected'])
        .withMessage('Status must be one of: Pending, In Progress, Completed, Rejected'),
    body('assignerId')
        .optional()
        .isMongoId()
        .withMessage('Assigner ID must be a valid Mongo ID'),
    body('workerId')
        .optional()
        .isMongoId()
        .withMessage('Worker ID must be a valid Mongo ID'),
  ],
  authMiddleware.auth,
  roleMiddlewares.requirePermission(PERMISSIONS.SUBMIT_KYC_REQUEST),
  kycRequestController.createKYCRequest
);

router.get('/user-kyc/counts', authMiddleware.auth, kycRequestController.getUserKYCDetails);

router.post(
  '/user-kyc/requests',
  [
    body('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    body('limit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Limit must be a positive integer'),
    body('sortBy')
      .optional()
      .isString()
      .withMessage('SortBy must be a string'),
    body('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be either "asc" or "desc"'),
  ],  
  authMiddleware.auth,
  roleMiddlewares.requirePermission(PERMISSIONS.SUBMIT_KYC_REQUEST),
  kycRequestController.getUserKYCRequests
);

router.get(
  'verify-ai/:id',
  authMiddleware.auth,
  roleMiddlewares.requirePermission(PERMISSIONS.VERIFY_KYC),
);

module.exports = router;
