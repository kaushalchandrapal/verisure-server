const { validationResult } = require('express-validator');
const authService = require('./services'); // Import the auth service

/**
 * Controller function to handle user signup.
 *
 */
const signup = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// create a new user
		const newUser = await authService.createUser({
			...req.body,
			role: req.body?.role || 'Applicant',
		});

		// Send a verification email
		await authService.sendEmailVerificationEmail(newUser._id);

		return res.status(201).json(newUser);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

/**
 * Controller function to handle user login.
 *
 */
const login = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		// Call the auth service to validate the user and get a token
		const { isValid, token, message } = await authService.validateUser(
			req.body
		);

		// If the user is not valid, return an error message
		if (!isValid) {
			return res.status(401).json({ message });
		}

		// Respond with the JWT token and user information (without password)
		return res.status(200).json({ isValid, token, message });
	} catch (error) {
		return res.status(500).json({ error: 'Internal server error' });
	}
};

/**
 * Controller function to handle email verification.
 */
const verifyEmail = async (req, res) => {
	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { token } = req.query;
		const verifyEmailStatus = await authService.verifyUserEmail(token);

		if (verifyEmailStatus) {
			return res
				.status(200)
				.json({ message: 'Email verified successfully' });
		} else {
			return res.status(400).json({ message: 'Invalid token' });
		}
	} catch (error) {
		console.log('Error in verifying email', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

/**
 * Controller to create a new user
 */
const createUserController = async (req, res) => {
	try {
		const userResponse = await authService.createUserFromAdmin(req.body);
		res.status(201).json({
			message: 'User created successfully',
			user: userResponse,
		});
	} catch (error) {
		console.error('Error creating user:', error);
		res.status(500).json({ message: 'Failed to create user', error: error.message });
	}
};

module.exports = {
	signup,
	login,
	verifyEmail,
	createUserController,
};
