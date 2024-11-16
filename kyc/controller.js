const { validationResult } = require('express-validator');
const kycRequestService = require('./services');
const KYCRequest = require('./model');
const documentServices = require('../Document/services');
const awsServices = require('../Aws/services');

const createKYCRequest = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const userId = req.user.id;
		const { documentType, images } = req.body;

		const activeRequest = await KYCRequest.findOne({
			user_id: userId,
			status: { $in: ['Pending', 'In Progress'] },
		});
		if (activeRequest) {
			return res.status(400).json({
				message:
					'You already have a KYC request in Pending or In Progress state.',
			});
		}

		const completedRequest = await KYCRequest.findOne({
			user_id: userId,
			status: 'Completed',
			valid_until: { $gt: new Date() },
		});

		if (completedRequest) {
			return res.status(400).json({
				message:
					'You cannot request a new KYC. Your previous KYC is still valid.',
			});
		}

		const documentPromises = images.map((image) =>
			documentServices.createDocument(documentType, image)
		);

		const createdDocuments = await Promise.all(documentPromises);
		const documentIds = createdDocuments.map((doc) => doc._id);

		const newKYCRequest = await kycRequestService.createKYCRequest(
			userId,
			documentIds
		);

		res.status(201).json({
			message: 'KYC request created successfully',
			data: newKYCRequest,
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error creating KYC request',
			error: error.message,
		});
	}
};

const getUserKYCDetails = async (req, res) => {
	const userId = req.user.id;
	try {
		const counts = await kycRequestService.detailsUserKYCRequestsByStatus(
			userId
		);
		res.status(200).json({
			counts: counts.countsByStatus,
			allKYCRequests: counts.allKYCRequests,
		});
	} catch (error) {
		res.status(500).json({
			message: 'Error retrieving KYC counts',
			error: error.message,
		});
	}
};

const getUserKYCRequests = async (req, res) => {
	try {
		const userId = req.user.id;

		const {
			page = 1,
			limit = 10,
			sortBy = 'created_at',
			order = 'asc',
		} = req.body;

		const data = await kycRequestService.getAllKYCRequestsForUser({
			userId,
			page,
			limit,
			sortBy,
			order,
		});

		res.status(200).json(data);
	} catch (error) {
		res.status(500).json({
			message: 'Failed to fetch KYC requests',
			error,
		});
	}
};

const verifyDocumentsWithAI = async (req, res) => {
	try {
		const { kycId } = req.params;

		// Fetch Documents
		const documents = await kycRequestService.getDocumentsByKycId(kycId);

		const documentType = documents[0]?.type;
		const documentUrls = documents.map((doc) =>
			awsServices.generateImageUrl(
				process.env.AWS_BUCKET_NAME,
				process.env.AWS_REGION,
				doc.location
			)
		);

		const { status, message } =
			await documentServices.validateDocumentWithAI(
				documentType,
				documentUrls
			);

		res.status(200).json({ status, message });
	} catch (error) {
		console.log('Error verifying documents with AI:', error);
		res.status(500).json({
			message: 'Failed to verify documents with AI',
			error,
		});
	}
};

module.exports = {
	createKYCRequest,
	getUserKYCDetails,
	getUserKYCRequests,
	verifyDocumentsWithAI,
};
