/**
 * Middleware to check if the user has the required permission.
 * @param {String} requiredPermission - The permission required to access the route.
 * @returns {Function} The middleware function.
 */
const requirePermission = (requiredPermission) => {
	return (req, res, next) => {
		// Ensure user and permissions exist in req object		
		if (!req.user || !req.user.permissions) {
			return res
				.status(403)
				.json({ message: 'Access denied. User not authenticated.' });
		}

		// Check if the required permission is present in user's permissions
		if (!req.user.permissions.has(requiredPermission)) {
			return res
				.status(403)
				.json({ message: 'Access denied. Insufficient permissions.' });
		}

		// User has required permission, proceed to next middleware or route handler
		next();
	};
};

module.exports = { requirePermission };
