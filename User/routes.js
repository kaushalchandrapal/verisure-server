const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const userControllers = require('./controllers');
const authMiddleware = require('../Auth/middleware');
const { requirePermission } = require('../Role/middleware');
const PERMISSIONS = require('../constants/permissions');

/**
 * Route to check if a user exists by email
 * GET /api/user/check-username?username=test@gmail.com
 */
router.get(
	'/email/exists',
	[
		// Validate the email query parameter
		query('email')
			.isEmail()
			.withMessage('Please provide a valid email address')
			.normalizeEmail(),
	],
	userControllers.doesEmailExist
);

/**
 * Route to check if a user exists by username
 * GET /api/user/check-username?username=test
 */
router.get(
	'/username/exists',
	[
		// Validate the username query parameter
		query('username')
			.isLength({ min: 3 })
			.withMessage('Username must be at least 3 characters long')
			.trim()
			.escape(),
	],
	userControllers.doesUsernameExist
);

/**
 * Route to check if a user exists by username
 * GET /api/user/check-username?username=test
 */
router.get('/', authMiddleware.auth, userControllers.getUserInformation);

/**
 * Route to check if a user exists by username
 * GET /api/user/workers
 */
router.get(
	'/workers',
	authMiddleware.auth,
	requirePermission(PERMISSIONS.GET_WORKERS),
	userControllers.getAllWorkers
);

/**
 * Route to check if a user exists by username
 * GET /api/user/supervisors
 */
router.get(
	'/supervisors',
	authMiddleware.auth,
	requirePermission(PERMISSIONS.GET_SUPERVISORS),
	userControllers.getAllSupervisors
);

module.exports = router;
