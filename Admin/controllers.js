const userServices = require('../User/services');
const kycServices = require('../Kyc/services');

/**
 * Controller to get combined counts for users and KYC requests.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getCounts = async (req, res) => {
	try {
		// Fetch user counts and KYC counts
		const userCounts = await userServices.getUserCounts();
		const kycCounts = await kycServices.getKycCounts();

		// Combine the counts into a single response object
		const response = {
			users: userCounts,
			kycRequests: kycCounts,
		};

		// Send the combined response
		return res.status(200).json({
			success: true,
			message: 'Counts retrieved successfully',
			data: response,
		});
	} catch (error) {
		console.error('Error in getCounts controller:', error);

		// Handle errors and send an appropriate response
		return res.status(500).json({
			success: false,
			message: 'Failed to retrieve counts',
			error: error.message,
		});
	}
};

module.exports = { getCounts };
