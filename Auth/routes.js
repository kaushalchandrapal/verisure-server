const express = require('express');
const { body, query } = require('express-validator');
const authController = require('./controllers');
const authMiddlewares = require('./middleware');
const roleMiddlewares = require('../Role/middleware');
const roleServices = require('../Role/services');
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
		body('first_name')
			.not()
			.isEmpty()
			.withMessage('First name is required')
			.trim()
			.escape(),
		body('last_name')
			.not()
			.isEmpty()
			.withMessage('Last name is required')
			.trim()
			.escape(),
		body('birthdate')
			.isDate()
			.withMessage('Birthdate must be a valid date')
			.custom((value) => {
				if (new Date(value) >= new Date()) {
					throw new Error('Birthdate must be earlier than today');
				}
				return true;
			}),
		body('address')
			.not()
			.isEmpty()
			.withMessage('Address is required')
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
	'/:role/login',
	[
		body('email')
			.isEmail()
			.withMessage('Please provide a valid email')
			.normalizeEmail(),
		body('password').not().isEmpty().withMessage('Password is required'),
		// body('role')
		// 	.not()
		// 	.isEmpty()
		// 	.withMessage('Role is required')
		// 	.custom(async (value) => {
		// 		const roleObjs = await roleServices.getAllRoles();
		// 		const roles = roleObjs.map((role) => role.name);
		// 		if (!roles.includes(value)) {
		// 			throw new Error(
		// 				`Role must be one of the following: ${roles.join(', ')}`
		// 			);
		// 		}
		// 		return true;
		// 	}),
	],
	(req, res, next) => {
		req.body.role = req.params.role;
		console.log("req.params.role",req.params.role)
		next();
	},
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

router.post(
	'/create-new-user',
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
		body('role')
			.not()
			.isEmpty()
			.withMessage('Role is required')
			.trim()
			.escape(),
	],
	// Validate user is authenticated
	authMiddlewares.auth,
	// Validate user has required permission
	roleMiddlewares.requirePermission(PERMISSIONS.CREATE_WORKER),
	roleMiddlewares.requirePermission(PERMISSIONS.CREATE_SUPERVISOR),
	authController.createUserController
);

module.exports = router;
