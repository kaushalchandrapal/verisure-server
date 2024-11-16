const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const awsControllers = require('./controllers.js');
const authMiddlewares = require('../Auth/middleware.js');
const roleMiddlewares = require('../Role/middleware.js');
const PERMISSIONS = require('../constants/permissions.js');
/**
 * Route to generate multiple presigned URLs for uploading files to S3
 * POST /pre-signed-url
 */
router.post(
	'/pre-signed-url',
	[
		body('fileNames')
			.isArray({ min: 1 })
			.withMessage('File names must be a non-empty array'),

		// Validate each item in the fileNames array
		body('fileNames.*')
			.isString()
			.withMessage('Each file name must be a string')
			.notEmpty()
			.withMessage('File names cannot be empty'),
	],
	authMiddlewares.auth,
	roleMiddlewares.requirePermission(PERMISSIONS.SUBMIT_KYC_REQUEST),
	awsControllers.getMultiplePresignedUrls
);

module.exports = router;
