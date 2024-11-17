const bcrypt = require('bcrypt'); // Import bcrypt for password hashing and comparison
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for generating and verifying JWT tokens
const userService = require('../User/services'); // Import user service for database operations
const emailService = require('../Email/services'); // Import email service for database operations
const roleServices = require('../Role/services'); // Import email service for database operations

/**
 * Creates a hashed password using bcrypt.
 *
 * @param {String} password - The plaintext password to be hashed.
 * @returns {String} A promise that resolves with the hashed password.
 */
const createHash = async (password) => {
	try {
		const saltRounds = 10; // Define the number of salt rounds for hashing
		return await bcrypt.hash(password, saltRounds); // Hash the password using bcrypt
	} catch (error) {
		return Promise.reject(error); // Reject the promise with an error if hashing fails
	}
};

/**
 * Validates a password by comparing it with the stored hash.
 *
 * @param {String} password - The plaintext password to be compared.
 * @param {String} hash - The hashed password stored in the database.
 * @returns {Boolean} A promise that resolves to true if the passwords match, or false if they don't.
 */
const validateHash = async (password, hash) => {
	try {
		return await bcrypt.compare(password, hash); // Compare the plaintext password with the hashed password
	} catch (error) {
		return Promise.reject(error); // Reject the promise with an error if comparison fails
	}
};

/**
 * Generates a JWT token.
 *
 * @param {Object} payload - The payload to be encoded in the JWT token (e.g., user data).
 * @returns {String} A promise that resolves with the generated JWT token.
 */
const generateJWTToken = async (payload) => {
	try {
		const jwtSecret = process.env.JWT_SECRET; // Get the JWT secret from environment variables
		if (!jwtSecret) {
			throw new Error('JWT_SECRET not found in environment variables.');
		}
		// Sign and generate the JWT token with a 24-hour expiration time
		return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
	} catch (error) {
		return Promise.reject(error); // Reject the promise with an error if token generation fails
	}
};

/**
 * Verifies a JWT token.
 *
 * @param {String} token - The JWT token to be verified.
 * @returns {Object} The decoded payload if the token is valid.
 */
const verifyJWTToken = async (token) => {
	try {
		const jwtSecret = process.env.JWT_SECRET; // Get the JWT secret from environment variables
		if (!jwtSecret) {
			throw new Error('JWT_SECRET not found in environment variables.');
		}
		// Verify the token using the secret and return the decoded payload
		const decoded = jwt.verify(token, jwtSecret);
		return decoded;
	} catch (error) {
		// Handle any error that occurs during token verification (token could be invalid or expired)
		return Promise.reject(error);
	}
};

/**
 * Service function to create a new user.
 *
 * @param {Object} userData - The user data object containing email, password, and username.
 * @returns {Object} The created user object (without the password) or an error.
 */
const createUser = async (userData) => {
	try {
		// Hash the password before storing the user in the database
		const hashedPassword = await createHash(userData.password);

		// Create a new user object with the hashed password
		const newUser = {
			email: userData.email,
			passwordHash: hashedPassword,
			username: userData.username,
			role: userData.role,
			firstName: userData.firstName,
			lastName: userData.lastName,
			birthdate: userData.birthdate,
			address: userData.address,
		};

		// Store the new user in the database using the user service
		const createdUser = await userService.createUser(newUser);

		// Remove the password hash from the created user object before returning it
		delete createdUser.password_hash;

		return createdUser; // Return the created user without the password hash
	} catch (error) {
		// Catch and rethrow any error encountered during user creation
		throw new Error(error.message || 'Error in creating user.');
	}
};

/**
 * Service function to validate a user during login.
 *
 * @param {Object} userData - The user data object containing email and password.
 * @returns {Object} An object indicating whether the user is valid, a JWT token, and a success message.
 */
const validateUser = async (userData) => {
	try {
		// Find the user by email using the user service
		const user = await userService.getUserByEmail(userData.email);
		if (!user) {
			// If user does not exist, return an invalid status and an error message
			return { isValid: false, message: 'Invalid username or password' };
		}

		// Compare the provided password with the stored hashed password
		const isPasswordValid = await validateHash(
			userData.password,
			user.password_hash
		);

		if (!isPasswordValid) {
			// If the password is invalid, return an invalid status and an error message
			return { isValid: false, message: 'Invalid username or password' };
		}

		// Remove the password hash from the user object
		delete user.password_hash;

		const roleOfUser = await roleServices.getUserRolesByUserId(user._id);

		// Generate a JWT token with the user data
		const token = await generateJWTToken({
			id: user._id,
			email: user.email,
			username: user.username,
			firstName: user.first_name,
			lastName: user.last_name,
			role: roleOfUser?.name || 'Applicant',
		});

		// Return the token and user information (without the password)
		return {
			isValid: true,
			token,
			message: 'User authenticated successfully',
			role: roleOfUser?.name,
		};
	} catch (error) {
		// Catch and rethrow any error encountered during validation
		throw new Error(error.message || 'Error validating user.');
	}
};

/**
 * Service function to send an email verification email to a user.
 *
 * @param {userId} string - The user ID to send the email verification to.
 */
const sendEmailVerificationEmail = async (userId) => {
	try {
		// Find the user by email using the user service
		const user = await userService.getUserById(userId);

		// If user does not exist, throw an error
		if (!user) {
			throw new Error('User not found');
		}

		// Generate a JWT token with the user ID
		const token = await generateJWTToken({ userId });

		// Send an email to the user with the verification token
		return emailService.sendEmail(
			user.email,
			'Verify your email',
			`Click here to verify your email: ${process.env.SERVER_URL}/api/auth/verify-email?query=${token}`
		);
	} catch (error) {
		// Catch and rethrow any error encountered during validation
		throw new Error(
			error.message || 'Error during email verification email sending.'
		);
	}
};

/**
 * Service function to send an email verification email to a user.
 *
 * @param {userId} string - The user ID to send the email verification to.
 */
const verifyUserEmail = async (token) => {
	try {
		// Verify the token
		const { userId } = await verifyJWTToken(token);

		// If user does not exist, return false
		if (!userId) {
			return false;
		}

		// Update the user emailVerified status
		await userService.updateUserById(userId, { email_verified: true });

		return true;
	} catch (error) {
		// Catch and rethrow any error encountered during validation
		throw new Error(error.message || 'Error during verifying user email.');
	}
};

/**
 * Creates an Admin user with the Admin role.
 * @param {Object} adminData - The data for the admin user (e.g., email, passwordHash, username).
 * @returns {Object} The created admin user object.
 */
const createAdmin = async (username, email, password) => {
	try {
		// Create admin user with the Admin role
		const adminUserData = {
			email,
			password,
			username,
			role: 'Admin',
		};

		const adminUser = await createUser(adminUserData);
		return adminUser;
	} catch (error) {
		throw new Error(`Error creating admin user: ${error.message}`);
	}
};

/**
 * Retrieves a role by name
 *
 * @param {String} roleName - The name of the role to retrieve
 * @returns {Object|null} The role document if found, or null if the role doesn't exist
 */
const getRoleByName = async (roleName) => {
	try {
		const role = await Role.findOne({ name: roleName });
		if (!role) throw new Error('Role not found');
		return role;
	} catch (error) {
		throw new Error(`Error retrieving role: ${error.message}`);
	}
};

/**
 * Creates a new user in the database
 *
 * @param {Object} userData - The user data, including email, password, username, and role
 * @returns {Object} The created user object, without the password hash
 */
const createUserFromAdmin = async (userData) => {
	try {
		// Hash the password before storing the user in the database
		const hashedPassword = await createHash(userData.password);

		// Create a new user object with the hashed password and role ID
		const newUser = {
			email: userData.email,
			passwordHash: hashedPassword,
			username: userData.username,
			role: userData.role, // Store the role ID here
		};

		// Store the new user in the database using the user service
		const createdUser = await userService.createUser(newUser);

		// Remove the password hash from the created user object before returning it
		delete createdUser.password_hash;

		return createdUser; // Return the created user without the password hash
	} catch (error) {
		// Catch and rethrow any error encountered during user creation
		throw new Error(error.message || 'Error in creating user.');
	}
};

module.exports = {
	createUser,
	validateUser,
	generateJWTToken,
	verifyJWTToken,
	sendEmailVerificationEmail,
	verifyUserEmail,
	createAdmin,
	createUserFromAdmin,
	getRoleByName,
};
