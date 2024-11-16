const authServices = require('./services');
const roleServices = require('../Role/services');

const auth = async (req, res, next) => {
	try {
		// Check for Authorization header
		const authHeader = req.headers.authorization;

		// If header is missing, return 401 Unauthorized
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res
				.status(401)
				.json({ message: 'Authorization token missing or invalid' });
		}

		// Extract the token from the header, remove the 'Bearer ' part
		const token = authHeader.split(' ')[1];

		// Verify and decode the token
		const decoded = await authServices.verifyJWTToken(token);

		// Get user roles and permissions
		const roleObj = await roleServices.getUserRolesByUserId(decoded.id);
		const permissions = new Set(roleObj?.permissions || []);

		// Attach user details from the token to the request object
		req.user = { ...decoded, role: roleObj?.name, permissions };

		// Call the next middleware or route handler
		next();
	} catch (error) {
		// If token is invalid or expired, return 401 Unauthorized
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
};

module.exports = { auth };
