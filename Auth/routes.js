const express = require('express');
const { body, query } = require('express-validator');
const authController = require('./controllers');
const authMiddlewares = require('./middleware');
const roleMiddlewares = require('../Role/middleware');
const PERMISSIONS = require('../constants/permissions');

const router = express.Router();

/**
 * Route for user signup (register).
 * POST /api/auth/signup
 */
router.post(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('Please provide a valid email')
			.normalizeEmail(),
		body('password')
			.isLength({ min: 7 })
			.withMessage('Password must be at least 7 characters'),
		body('username')
			.not()
			.isEmpty()
			.withMessage('Username is required')
			.trim()
			.escape(),
	],
	authController.signup
);

/**
 * Route for user signup (register).
 * POST /api/auth/worker
 */
router.post(
	'/worker',
	[
		body('email')
			.isEmail()
			.withMessage('Please provide a valid email')
			.normalizeEmail(),
		body('password')
			.isLength({ min: 7 })
			.withMessage('Password must be at least 7 characters'),
		body('username')
			.not()
			.isEmpty()
			.withMessage('Username is required')
			.trim()
			.escape(),
	],
	// Validate user is authenticated
	authMiddlewares.auth,
	// Validate user has required permission
	roleMiddlewares.requirePermission(PERMISSIONS.CREATE_WORKER),
	// Set user role to 'Worker'
	(req, res, next) => {
		req.body.role = 'Worker';
		next();
	},
	authController.signup
);

/**
 * Route for user signup (register).
 * POST /api/auth/worker
 */
router.post(
	'/supervisor',
	[
		body('email')
			.isEmail()
			.withMessage('Please provide a valid email')
			.normalizeEmail(),
		body('password')
			.isLength({ min: 7 })
			.withMessage('Password must be at least 7 characters'),
		body('username')
			.not()
			.isEmpty()
			.withMessage('Username is required')
			.trim()
			.escape(),
	],
	// Validate user is authenticated
	authMiddlewares.auth,
	// Validate user has required permission
	roleMiddlewares.requirePermission(PERMISSIONS.CREATE_SUPERVISOR),
	// Set user role to 'Supervisor'
	(req, res, next) => {
		req.body.role = 'Supervisor';
		next();
	},
	authController.signup
);

/**
 * Route for user login.
 * POST /api/auth/login
 */
router.post(
	'/login',
	[
		body('email')
			.isEmail()
			.withMessage('Please provide a valid email')
			.normalizeEmail(),
		body('password').not().isEmpty().withMessage('Password is required'),
	],
	authController.login // Call the login controller function
);

/**
 * Route for user signup (register).
 * GET /api/auth/verify-email
 */
router.get(
	'/verify-email',
	[query('token').notEmpty().withMessage('Verification token is required.')],
	authController.verifyEmail
);

module.exports = router;
