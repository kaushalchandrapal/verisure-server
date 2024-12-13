const express = require('express');
const router = express.Router();
const { query, body, param } = require('express-validator');
const userControllers = require('./controllers');
const authMiddleware = require('../Auth/middleware');
const roleMiddleware = require('../Role/middleware');
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

/**
 * Route to get a paginated list of workers and supervisors
 * POST /api/user/workers-supervisors
 */
router.post(
	'/workers-supervisors',
	[
		body('page')
			.optional()
			.isInt({ min: 1 })
			.withMessage('Page must be a positive integer'),
		body('limit')
			.optional()
			.isInt({ min: 1 })
			.withMessage('Limit must be a positive integer'),
	],
	authMiddleware.auth,
	requirePermission(PERMISSIONS.GET_SUPERVISORS),
	userControllers.getAllWorkersAndSupervisors
);

router.get(
	'/:id',
	authMiddleware.auth,
	roleMiddleware.requirePermission(PERMISSIONS.VERIFY_KYC),
	[param('id').isMongoId().withMessage('Invalid ID format')],
	async (req, res, next) => {
		try {
			const userId = req.user.id;
			if (
				(await kycServices.findCaseByWorkerAndUser(
					userId,
					req.params.id
				)) ||
				(await kycServices.findCaseBySupervisorAndUser(
					userId,
					req.params.id
				))
			) {
				next();
			} else {
				res.status(403).json({
					error: 'You do not have permission to access this resource',
				});
			}
		} catch (error) {
			console.error('Internal server error');
			res.status(500).json({ error: 'Internal server error' });
		}
	},
	userControllers.getUserInformation
);





module.exports = router;
