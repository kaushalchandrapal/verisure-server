const userServices = require('./services');
const { validationResult } = require('express-validator');

/**
 * Function to check if a user exists with the provided email.
 *
 * @param {String} email - The email address to check.
 */
const doesEmailExist = async (req, res) => {
	// Validate the request data for errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// If there are validation errors, return a 400 status code and the list of errors
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// Extract the email from the query parameters
		const { email } = req.query;

		// Check if a user exists with the provided email using the user service
		const user = await userServices.getUserByEmail(email);

		if (user) {
			// If a user is found, respond with a 200 status code and a message
			return res.status(200).json({
				exists: true,
				message: 'User exists with this email.',
			});
		} else {
			// If no user is found, respond with a 404 status code and a message
			return res.status(404).json({
				exists: false,
				message: 'No user found with this email.',
			});
		}
	} catch (error) {
		// Log the error and return a 500 status code for any server-side errors
		console.error('Error checking email:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

/**
 * Function to check if a user exists with the provided username.
 *
 * @param {String} username - The username to check.
 */
const doesUsernameExist = async (req, res) => {
	// Validate the request data for errors (assuming express-validator is used)
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// If there are validation errors, return a 400 status code and the list of errors
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// Extract the username from the query parameters
		const { username } = req.query;

		// Check if a user exists with the provided username using the user service
		const user = await userServices.getUserByUsername(username);

		if (user) {
			// If a user is found, respond with a 200 status code and a message
			return res.status(200).json({
				exists: true,
				message: 'User exists with this username.',
			});
		} else {
			// If no user is found, respond with a 404 status code and a message
			return res.status(404).json({
				exists: false,
				message: 'No user found with this username.',
			});
		}
	} catch (error) {
		// Log the error and return a 500 status code for any server-side errors
		console.error('Error checking username:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

/**
 * Function to get user information
 */
const getUserInformation = async (req, res) => {
	// Validate the request data for errors (assuming express-validator is used)
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// If there are validation errors, return a 400 status code and the list of errors
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const userId = req.params.id || req.user.id;
		// Check if a user exists with the provided username using the user service
		const user = await userServices.getUserById(userId);
		delete user?.password_hash;

		if (user) {
			// If a user is found, respond with a 200 status code and a message
			return res.status(200).json({
				user: {
					...user,
					role: user?.role?.name,
					permissions: user?.role?.permissions,
				},
			});
		} else {
			// If no user is found, respond with a 404 status code and a message
			return res.status(404).json({
				exists: false,
				message: 'No user found with this user id.',
			});
		}
	} catch (error) {
		// Log the error and return a 500 status code for any server-side errors
		console.error('Error in getting user information:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

/**
 * Function to get all workers
 *
 */
const getAllWorkers = async (req, res) => {
	// Validate the request data for errors (assuming express-validator is used)
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// If there are validation errors, return a 400 status code and the list of errors
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// Check if a user exists with the provided username using the user service
		const workers = await userServices.getAllWorkers();

		if (workers.length) {
			// If a user is found, respond with a 200 status code and a message
			return res.status(200).json({
				workers,
			});
		} else {
			// If no user is found, respond with a 404 status code and a message
			return res.status(200).json({
				workers: [],
			});
		}
	} catch (error) {
		// Log the error and return a 500 status code for any server-side errors
		console.error('Error in getting all workers:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

/**
 * Function to get all workers
 *
 */
const getAllSupervisors = async (req, res) => {
	// Validate the request data for errors (assuming express-validator is used)
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		// If there are validation errors, return a 400 status code and the list of errors
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// Check if a user exists with the provided username using the user service
		const supervisors = await userServices.getAllSupervisors();

		if (supervisors.length) {
			// If a user is found, respond with a 200 status code and a message
			return res.status(200).json({
				supervisors,
			});
		} else {
			// If no user is found, respond with a 404 status code and a message
			return res.status(200).json({
				supervisors: [],
			});
		}
	} catch (error) {
		// Log the error and return a 500 status code for any server-side errors
		console.error('Error in getting all supervisors:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

const getAllWorkersAndSupervisors = async (req, res) => {
	// Validate the request data for errors (assuming express-validator is used)
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	// Get page and limit from query parameters, with default values
	const page = parseInt(req.body.page, 10) || 1;
	const limit = parseInt(req.body.limit, 10) || 10;

	try {
		// Retrieve workers and supervisors with pagination using the user service
		const {
			users,
			totalUsers,
			totalPages,
			currentPage,
			hasNextPage,
			hasPrevPage,
		} = await userServices.getAllSupervisorsAndWorkers(page, limit);

		return res.status(200).json({
			workersAndSupervisors: users,
			totalUsers,
			totalPages,
			currentPage,
			hasNextPage,
			hasPrevPage,
		});
	} catch (error) {
		console.error('Error in getting workers and supervisors:', error);
		return res.status(500).json({ error: 'Internal server error.' });
	}
};

module.exports = {
	doesEmailExist,
	doesUsernameExist,
	getUserInformation,
	getAllWorkers,
	getAllSupervisors,
	getAllWorkersAndSupervisors,
};
