const KYCRequest = require('./model');
const User = require('../User/model');
const PERMISSIONS = require('../constants/permissions');
const mongoose = require('mongoose');

const createKYCRequest = async (
	userId,
	documentIds = [],
	assignerId = null,
	workerId = null
) => {
	try {
		const kycRequest = new KYCRequest({
			user_id: userId,
			status: 'Pending',
			assigner_id: assignerId,
			worker_id: workerId,
			valid_until: null,
			documents: documentIds,
		});

		return await kycRequest.save();
	} catch (error) {
		throw new Error(error.message || 'Error creating KYC request');
	}
};

const updateKYCRequestStatus = async (kycRequestId, newStatus) => {
	const kycRequest = await KYCRequest.findById(kycRequestId);

	if (!kycRequest) {
		throw new Error('KYC Request not found');
	}

	kycRequest.status = newStatus;

	if (newStatus === 'Completed') {
		kycRequest.valid_until = new Date(
			Date.now() + 20 * 24 * 60 * 60 * 1000
		);
	}

	return await kycRequest.save();
};

const detailsUserKYCRequestsByStatus = async (userId) => {
	const [counts, allKYCRequests] = await Promise.all([
		KYCRequest.aggregate([
			{ $match: { user_id: new mongoose.Types.ObjectId(userId) } },
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
				},
			},
		]),

		KYCRequest.find(
			{ user_id: new mongoose.Types.ObjectId(userId) },
			{ created_at: 1, status: 1, expires_at: 1 }
		),
	]);

	const result = counts.reduce((acc, item) => {
		acc[item._id] = item.count;
		return acc;
	}, {});

	const total = Object.values(result).reduce((sum, count) => sum + count, 0);

	const countsByStatus = {
		Pending: result['Pending'] || 0,
		InProgress: result['In Progress'] || 0,
		Completed: result['Completed'] || 0,
		Rejected: result['Rejected'] || 0,
		total,
	};

	return {
		countsByStatus,
		allKYCRequests,
	};
};

const getAllKYCRequestsForUser = async ({
	userId,
	page = 1,
	limit = 10,
	sortBy = 'created_at',
	order = 'asc',
}) => {
	const pageNumber = Math.max(parseInt(page, 10), 1);
	const limitNumber = Math.max(parseInt(limit, 10), 1);
	const sortOrder = order === 'asc' ? 1 : -1;

	const kycDetails = await KYCRequest.find({ user_id: userId })
		.sort({ [sortBy]: sortOrder })
		.skip((pageNumber - 1) * limitNumber)
		.limit(limitNumber);

	const totalKYCRequests = await KYCRequest.countDocuments({
		user_id: userId,
	});
	const totalPages = Math.ceil(totalKYCRequests / limitNumber);

	return {
		kycDetails,
		pagination: {
			total: totalKYCRequests,
			totalPages,
			currentPage: pageNumber,
			hasNextPage: pageNumber < totalPages,
			hasPrevPage: pageNumber > 1,
		},
	};
};

const getAllKYCRequests = async ({
	page = 1,
	limit = 10,
	sortBy = 'created_at',
	order = 'asc',
}) => {
	const pageNumber = Math.max(parseInt(page, 10), 1);
	const limitNumber = Math.max(parseInt(limit, 10), 1);
	const sortOrder = order === 'asc' ? 1 : -1;

	const kycDetails = await KYCRequest.find()
		.sort({ [sortBy]: sortOrder })
		.skip((pageNumber - 1) * limitNumber)
		.limit(limitNumber);

	const totalKYCRequests = await KYCRequest.countDocuments({});
	
	const totalPages = Math.ceil(totalKYCRequests / limitNumber);

	return {
		kycDetails,
		pagination: {
			total: totalKYCRequests,
			totalPages,
			currentPage: pageNumber,
			hasNextPage: pageNumber < totalPages,
			hasPrevPage: pageNumber > 1,
		},
	};
};

/**
 * Retrieves documents associated with a given kycId
 *
 * @param {String} kycId - The KYC ID to filter documents by
 * @returns {Array} An array of document entries associated with the kycId
 */
const getDocumentsByKycId = async (kycId) => {
	try {
		if (!kycId) {
			throw new Error('KYC ID is required');
		}

		// Find documents with the specified kycId
		const documents = (
			await KYCRequest.findById(kycId)
				.select(['documents'])
				.populate('documents')
		)?.documents;

		return documents;
	} catch (error) {
		console.error('Error retrieving documents:', error);
		throw new Error('Failed to retrieve documents');
	}
};

/**
 * Function to assign a case to a worker with a supervisor's supervision
 *
 * @param {String} supervisorId - The ID of the supervisor assigning the case
 * @param {String} workerId - The ID of the worker to whom the case is assigned
 * @param {String} kycId - The ID of the case to update
 * @returns {Object|null} The updated case document if successful, or null if the case doesn't exist
 */
const assignCase = async (supervisorId, workerId, kycId) => {
	try {
		if (!supervisorId || !workerId || !kycId) {
			throw new Error(
				'Supervisor ID, Worker ID, and Case ID are required'
			);
		}

		const supervisor = await User.findById(supervisorId).populate('role');
		if (!supervisor) {
			throw new Error('Supervisor not found');
		}
		if (!supervisor.role.permissions.includes(PERMISSIONS.ASSIGN_KYC)) {
			throw new Error('User does not have permission to assign KYC');
		}

		const worker = await User.findById(workerId).populate('role');
		if (!worker) {
			throw new Error('Worker not found');
		}
		if (!worker.role.permissions.includes(PERMISSIONS.VERIFY_KYC)) {
			throw new Error('User does not have permission to work on KYC');
		}

		// Check if the case already assigned
		const existingCase = await KYCRequest.findById(kycId);
		if (!existingCase) {
			throw new Error('Case not found');
		}
		if (existingCase.worker_id) {
			throw new Error('Case already assigned');
		}

		// Update the case document with the provided details
		let updatedCase = await KYCRequest.findByIdAndUpdate(
			kycId,
			{
				assigner_id: supervisorId,
				worker_id: workerId,
			},
			{ new: true } // Return the updated document
		);

		updatedCase = await updateKYCRequestStatus(kycId, 'In Progress', {
			new: true,
		});

		return updatedCase.toObject();
	} catch (error) {
		console.error('Error assigning case:', error);
		throw new Error('Failed to assign case');
	}
};

/**
 * Finds a case based on worker ID and user ID.
 *
 * @param {String} workerId - The ID of the worker.
 * @param {String} userId - The ID of the user.
 * @returns {Object|null} The case document if found, or null if not found.
 */
const findCaseByWorkerAndUser = async (workerId, userId) => {
	try {
		if (!workerId || !userId) {
			throw new Error('Both worker ID and user ID are required');
		}

		// Query the KYCRequest collection for the case
		const caseDocument = await KYCRequest.findOne({
			worker_id: workerId,
			user_id: userId,
		});

		return caseDocument;
	} catch (error) {
		console.error('Error finding case by worker and user:', error);
		throw new Error('Failed to find case');
	}
};

/**
 * Finds a case based on assigner ID and user ID.
 *
 * @param {String} assignerId - The ID of the supervisor/assigner.
 * @param {String} userId - The ID of the user.
 * @returns {Object|null} The case document if found, or null if not found.
 */
const findCaseBySupervisorAndUser = async (assignerId, userId) => {
	try {
		if (!assignerId || !userId) {
			throw new Error('Both supervisor ID and user ID are required');
		}

		// Query the KYCRequest collection for the case
		const caseDocument = await KYCRequest.findOne({
			assigner_id: assignerId,
			user_id: userId,
		});

		return caseDocument;
	} catch (error) {
		console.error('Error finding case by supervisor and user:', error);
		throw new Error('Failed to find case');
	}
};

module.exports = {
	createKYCRequest,
	updateKYCRequestStatus,
	detailsUserKYCRequestsByStatus,
	getAllKYCRequestsForUser,
	getDocumentsByKycId,
	assignCase,
	findCaseByWorkerAndUser,
	findCaseBySupervisorAndUser,
	getAllKYCRequests,
};
