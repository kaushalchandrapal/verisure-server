const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../Auth/middleware');
const kycRequestController = require('./controller');
const roleMiddlewares = require('../Role/middleware');
const PERMISSIONS = require('../constants/permissions');
const DOCUMENT_TYPES = require('../constants/documentTypes');

const router = express.Router();

// POST route for creating a new KYC request
router.post(
	'/create',
	authMiddleware.auth,
	roleMiddlewares.requirePermission(PERMISSIONS.SUBMIT_KYC_REQUEST),
	[
		body('documentType')
			.isString()
			.withMessage('Document type must be a string')
			.isIn(
				Object.values(DOCUMENT_TYPES).map((type) => type.toLowerCase())
			)
			.withMessage(
				`Document type must be one of: ${Object.values(DOCUMENT_TYPES)
					.map((type) => type.toLowerCase())
					.join(', ')}`
			),
		body('images')
			.isArray({ min: 1 })
			.withMessage('Images must be a non-empty array'),
		body('images.*').isString().withMessage('Each image must be a string'),
	],
	kycRequestController.createKYCRequest
);

router.get(
	'/user-kyc/counts',
	authMiddleware.auth,
	kycRequestController.getUserKYCDetails
);

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

router.post(
	'/verify-ai/:kycId',
	authMiddleware.auth,
	roleMiddlewares.requirePermission(PERMISSIONS.VERIFY_KYC),
	kycRequestController.verifyDocumentsWithAI
);

router.post(
	'/assign',
	authMiddleware.auth,
	roleMiddlewares.requirePermission(PERMISSIONS.ASSIGN_KYC),
	[
		body('kycId')
			.not()
			.isEmpty()
			.withMessage('KYC ID is required')
			.isMongoId()
			.withMessage('KYC ID must be a valid MongoDB ObjectId'),
		body('workerId')
			.not()
			.isEmpty()
			.withMessage('Worker ID is required')
			.isMongoId()
			.withMessage('Worker ID must be a valid MongoDB ObjectId'),
	],
	kycRequestController.assignCase
);

module.exports = router;
