const User = require('./model');
const Role = require('../Role/model');
const roleServices = require('../Role/services');
const PERMISSIONS = require('../constants/permissions');

/**
 * Function to create and store a new user in the database.
 *
 * @param {Object} userData - The user data object containing email, passwordHash, and username.
 * @returns {Object} The newly created user document or an error if the process fails.
 */
const createUser = async (userData) => {
	try {
		const role = await roleServices.getRoleByName(userData.role);
		if (!role) {
			throw new Error('Role does not exist');
		}

		// Create a new instance of the User model with the provided user data
		const user = new User({
			email: userData?.email, // Store the user's email
			password_hash: userData?.passwordHash, // Store the hashed password (should be pre-hashed)
			username: userData?.username, // Store the user's username
			role: role._id, // Store the user's role
			first_name: userData?.firstName, // Store the user's first name
			last_name: userData?.lastName, // Store the user's last name
			birthdate: userData?.birthdate, // Store the user's birthdate
			address: userData?.address, // Store the user's address
		});

		// Save the new user document to the database
		const savedUser = await user.save();

		// Convert the saved user document to a plain object
		const savedUserObj = savedUser.toObject();

		// Return the saved user document
		return savedUserObj;
	} catch (error) {
		// Return a rejected Promise if an error occurs
		return Promise.reject(error);
	}
};

/**
 * Function to retrieve a user by their unique ID.
 *
 * @param {String} userId - The unique ID of the user.
 * @returns {Object|null} The user document if found, or null if the user doesn't exist.
 */
const getUserById = async (userId) => {
	try {
		// Get user by ID and exclude the password hash
		const user = await User.findById(userId)
			.populate('role')
			.populate({
				path: 'assigned_cases', // Populate the 'assigned_cases' field
				populate: [
					{
						path: 'documents', // Populate the 'documents' field within 'assigned_cases'
					},
					{
						path: 'user_id',
					},
				],
			});

		// Return the user if found, otherwise return null
		return user.toObject();
	} catch (error) {
		// Return a rejected Promise if an error occurs
		return Promise.reject(error);
	}
};

/**
 * Function to retrieve a user by their email address.
 *
 * @param {String} email - The user's email address.
 * @returns {Object|null} The user document if found, or null if the user doesn't exist.
 */
const getUserByEmail = async (email) => {
	try {
		// Get user by email address and exclude the password hash
		const user = await User.findOne({ email });

		if (!user) {
			return null;
		}

		// Return the user if found, otherwise return null
		return user.toObject();
	} catch (error) {
		// Return a rejected Promise if an error occurs
		return Promise.reject(error);
	}
};

/**
 * Function to retrieve a user by their username.
 *
 * @param {String} username - The user's unique username.
 * @returns {Object|null} The user document if found, or null if the user doesn't exist.
 */
const getUserByUsername = async (username) => {
	try {
		// Get the user from database by their username and exclude the password hash
		const user = await User.findOne({ username });

		// Return the user if found, otherwise return null
		return user.toObject();
	} catch (error) {
		// Return a rejected Promise if an error occurs
		return Promise.reject(error);
	}
};

/**
 * Function to update a user by their unique ID.
 *
 * @param {String} userId - The unique ID of the user to be updated.
 * @param {Object} updateData - The data to update in the user document (e.g., email, username, etc.).
 * @returns {Object|null} The updated user document if the update is successful, or null if the user doesn't exist.
 */
const updateUserById = async (userId, updateData) => {
	try {
		// The { new: true } option ensures the function returns the updated document, not the original
		const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
			new: true,
		});

		// Return the updated user if found and updated, otherwise return null
		return updatedUser.toObject();
	} catch (error) {
		// Return a rejected Promise if an error occurs
		return Promise.reject(error);
	}
};

/**
 * Function to delete a user by their unique ID.
 *
 * @param {String} userId - The unique ID of the user to be deleted.
 * @returns {Object|null} The deleted user document if the deletion is successful, or null if the user doesn't exist.
 */
const deleteUserById = async (userId) => {
	try {
		// Delete the user by their ID
		const deletedUser = await User.findByIdAndDelete(userId).select(
			'-password_hash'
		);

		// Return the deleted user if found, otherwise return null
		return deletedUser.toObject();
	} catch (error) {
		// Return a rejected Promise if an error occurs
		return Promise.reject(error);
	}
};

/**
 * Retrieves all users with the 'Worker' role.
 * @returns {Array} An array of users with the Worker role.
 */
const getAllWorkers = async () => {
	try {
		// Find the role ID for Worker
		const workerRole = await Role.findOne({ name: 'Worker' });
		if (!workerRole) {
			throw new Error('Worker role not found');
		}

		// Find users with the Worker role
		const workers = await User.find({ role: workerRole._id }).lean();

		for (const worker of workers) {
			worker.role = workerRole.name;
			worker.permissions = workerRole.permissions;
			delete worker.password_hash;
		}

		return workers;
	} catch (error) {
		throw new Error(`Error retrieving workers: ${error.message}`);
	}
};

/**
 * Retrieves all users with the 'Supervisor' role.
 * @returns {Array} An array of users with the Supervisor role.
 */
const getAllSupervisors = async () => {
	try {
		// Find the role ID for 'Supervisor'
		const supervisorRole = await Role.findOne({ name: 'Supervisor' });
		if (!supervisorRole) throw new Error('Supervisor role not found');

		// Find users with the Supervisor role
		const supervisors = await User.find({
			role: supervisorRole._id,
		}).lean();

		for (const supervisor of supervisors) {
			supervisor.role = supervisorRole.name;
			supervisor.permissions = supervisorRole.permissions;
			delete supervisor.password_hash;
		}

		return supervisors;
	} catch (error) {
		throw new Error(`Error retrieving supervisors: ${error.message}`);
	}
};

const getAllSupervisorsAndWorkers = async (page = 1, limit = 10) => {
	try {
		// Find the role IDs for 'Worker' and 'Supervisor'
		const workerRole = await Role.findOne({ name: 'Worker' });
		const supervisorRole = await Role.findOne({ name: 'Supervisor' });

		if (!workerRole) throw new Error('Worker role not found');
		if (!supervisorRole) throw new Error('Supervisor role not found');

		// Calculate the skip value for pagination
		const skip = (page - 1) * limit;

		// Find users with either the Supervisor or Worker role, with pagination
		const users = await User.find({
			role: { $in: [supervisorRole._id, workerRole._id] },
		})
			.skip(skip)
			.limit(limit)
			.lean();

		for (const user of users) {
			const role =
				user.role.toString() === supervisorRole._id.toString()
					? supervisorRole
					: workerRole;
			user.role = role.name;
			user.permissions = role.permissions;
			delete user.password_hash;
		}

		// Get the total count for pagination info
		const totalUsers = await User.countDocuments({
			role: { $in: [supervisorRole._id, workerRole._id] },
		});

		const totalPages = Math.ceil(totalUsers / limit);

		return {
			users,
			totalUsers,
			totalPages,
			currentPage: page,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		};
	} catch (error) {
		throw new Error(
			`Error retrieving supervisors and workers: ${error.message}`
		);
	}
};

/**
 * Function to assign a KYC ID to a user by their unique ID.
 *
 * @param {String} userId - The unique ID of the user to update.
 * @param {String} kycId - The KYC ID to assign to the user.
 * @returns {Object|null} The updated user document if successful, or null if the user doesn't exist.
 */
const assignKycToUser = async (userId, kycId) => {
	try {
		if (!userId || !kycId) {
			throw new Error('Both userId and kycId are required');
		}

		// Check if the user is worker or supervisor
		const user = await User.findById(userId).populate('role');
		if (!user) {
			throw new Error('User not found');
		}

		// Check if the user is a worker or supervisor
		if (
			!(
				user.role.permissions.includes(PERMISSIONS.ASSIGN_KYC) ||
				user.role.permissions.includes(PERMISSIONS.VERIFY_KYC)
			)
		) {
			throw new Error(
				'User does not have permission to get assigned KYC'
			);
		}

		// Update the user document with the provided kycId
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ $push: { assigned_cases: kycId } }, // Add the kycId to the assigned_cases array
			{ new: true } // Return the updated document
		).select('-password_hash'); // Exclude the password hash from the result

		// If the user doesn't exist, return null
		if (!updatedUser) {
			throw new Error('User not found');
		}

		return updatedUser.toObject();
	} catch (error) {
		console.error('Error assigning KYC to user:', error);
		throw new Error('Failed to assign KYC to user');
	}
};

/**
 * Function to count total users and users by their roles.
 *
 * @returns {Object} An object containing the counts of total users and counts for each role.
 */
const getUserCounts = async () => {
	try {
		// Fetch all roles
		const roles = await roleServices.getAllRoles();

		// Map roles to their names and IDs for easier reference
		const roleMap = roles.reduce((acc, role) => {
			acc[role.name] = role._id.toString();
			return acc;
		}, {});

		// Initialize the counts object
		const counts = {
			totalUsers: 0,
			Applicant: 0,
			Supervisor: 0,
			Admin: 0,
			Worker: 0,
		};

		// Count total users
		counts.totalUsers = await User.countDocuments();

		// Count users by each role
		for (const roleName in roleMap) {
			counts[roleName] = await User.countDocuments({
				role: roleMap[roleName],
			});
		}

		console.log("counts",counts)

		return counts;
	} catch (error) {
		console.error('Error fetching user counts:', error);
		throw new Error('Failed to fetch user counts');
	}
};

// Export all the functions so they can be used in other parts of the application
module.exports = {
	createUser,
	getUserById,
	getUserByEmail,
	getUserByUsername,
	updateUserById,
	deleteUserById,
	getAllWorkers,
	getAllSupervisors,
	getAllSupervisorsAndWorkers,
	assignKycToUser,
	getUserCounts,
};
