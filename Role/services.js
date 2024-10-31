const Role = require('./model');
const User = require('../User/model');
const PERMISSIONS = require('../constants/permissions');

/**
 *
 * @param {[PERMISSIONS]} permissions - Permissions to validate
 * @returns {[PERMISSIONS]} Filtered permissions
 */
const validatePermissions = (permissions) => {
	const validPermissions = Object.values(PERMISSIONS);
	const filteredPermissions = permissions.filter((permission) =>
		validPermissions.includes(permission)
	);
	return filteredPermissions;
};

/**
 * Creates a new role with the specified name and permissions.
 * @param {String} roleName - The name of the role.
 * @param {Array} permissions - Array of permissions to assign to the role.
 * @returns {Object} The created role.
 */
const createRole = async (roleName, permissions) => {
	try {
		permissions = validatePermissions(permissions);

		// Create the role
		const role = new Role({ name: roleName, permissions });
		await role.save();

		return role;
	} catch (error) {
		throw new Error(`Error creating role: ${error.message}`);
	}
};

/**
 * Adds new permissions to an existing role.
 * @param {String} roleId - The ID of the role to update.
 * @param {Array} newPermissions - Array of permissions to add to the role.
 * @returns {Object} The updated role.
 */
const addPermissions = async (roleName, newPermissions) => {
	try {
		// Validate the permissions
		newPermissions = validatePermissions(newPermissions);

		// Find the role and update its permissions
		const role = await Role.findOne({ name: roleName });

		// If the role doesn't exist, throw an error
		if (!role) {
			throw new Error(`Role not found`);
		}

		// Add the new permissions to the role
		const res = await Role.updateOne(
			{ name: roleName },
			{ $addToSet: { permissions: { $each: newPermissions } } }
		);

		return res;
	} catch (error) {
		throw new Error(`Error adding permissions to role: ${error.message}`);
	}
};

/**
 *
 * @param {string} roleName - The name of the role to find.
 * @returns {Object | null} The role object if found, or null if not found.
 */
const getRoleByName = async (roleName) => {
	try {
		const role = await Role.findOne({ name: roleName });
		return role;
	} catch (error) {
		throw new Error(`Error finding role: ${error.message}`);
	}
};

/**
 * Retrieves the user's role by their user ID.
 * @param {String} userId - The ID of the user.
 * @returns {Object | null} The user's role information, or null if not found.
 */
const getUserRolesByUserId = async (userId) => {
	try {
		// Find the user and populate the role information
		const user = await User.findById(userId).populate('role');
		if (!user) {
			throw new Error('User not found');
		}
		return user.role;
	} catch (error) {
		throw new Error(`Error retrieving user roles: ${error.message}`);
	}
};

const getAllRoles = async () => {
  try {
    return await Role.find();
  } catch (error) {
    throw new Error(`Error retrieving roles: ${error.message}`);
  }
};


module.exports = {
	createRole,
	addPermissions,
	getRoleByName,
	getUserRolesByUserId,
  getAllRoles,
};
