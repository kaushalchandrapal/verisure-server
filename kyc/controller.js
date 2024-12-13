const axios = require('axios');
const { validationResult } = require('express-validator');
const KYCRequest = require('./model');
const documentServices = require('../Document/services');
const awsServices = require('../Aws/services');
const userServices = require('../User/services');
const kycServices = require('./services');

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

		const newKYCRequest = await kycServices.createKYCRequest(
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
		const counts = await kycServices.detailsUserKYCRequestsByStatus(userId);
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

		const data = await kycServices.getAllKYCRequestsForUser({
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

const getAllKYCRequests = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			page = 1,
			limit = 10,
			sortBy = 'created_at',
			order = 'asc',
		} = req.body;

		const data = await kycServices.getAllKYCRequests({
			page,
			limit,
			sortBy,
			order,
		});

		res.status(200).json({ data });
	} catch (error) {
		console.log('Error getting all kyc requests:', error);
		res.status(500).json({
			message: 'Failed to get kyc requests',
			error,
		});
	}
};

const verifyDocumentsWithAI = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { kycId } = req.params;

		// Fetch Documents
		const documents = await kycServices.getDocumentsByKycId(kycId);

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

		if (!status) {
			await kycServices.updateKYCRequestAiStatus(
				kycId,
				'Rejected',
				message
			);
			await kycServices.updateKYCRequestStatus(
				kycId,
				'Rejected',
				message
			);
		} else {
			await kycServices.updateKYCRequestAiStatus(kycId, 'Completed');
		}

		res.status(200).json({ status, message });
	} catch (error) {
		console.log('Error verifying documents with AI:', error);
		res.status(500).json({
			message: 'Failed to verify documents with AI',
			error,
		});
	}
};

const assignCase = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { workerId, kycId } = req.body;
		const supervisorId = req.user.id;

		// Update the KYC request
		await kycServices.assignCase(supervisorId, workerId, kycId);

		// Assign the case to the worker and supervisor
		await userServices.assignKycToUser(workerId, kycId);
		await userServices.assignKycToUser(supervisorId, kycId);

		res.status(200).json({ message: 'Case assigned successfully' });
	} catch (error) {
		console.log('Error assigning case:', error);
		res.status(500).json({
			message: 'Failed to assign case to worker',
			error,
		});
	}
};

const updateCaseStatus = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { kycId, status, message } = req.body;
		const workerId = req.user.id;

		// Update the KYC request
		await kycServices.updateKYCRequestStatus(kycId, status, message);

		res.status(200).json({ message: 'Case updated successfully' });
	} catch (error) {
		console.log('Error assigning case:', error);
		res.status(500).json({
			message: 'Failed to assign case to worker',
			error,
		});
	}
};

const handlePDFDownload = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { kycId } = req.params;
    const pdfData = await kycServices.generatePDF(kycId);

    const response = await axios.get(pdfData.pdfUrl, {
      responseType: 'arraybuffer',
    });

    // Generate a dynamic filename without underscores at the start and end
    const fileName = `KYC_Report_${kycId}.pdf`; // Ensure filename has no undesired characters

    // Set headers to indicate a file attachment with a clean filename
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(response.data);
  } catch (error) {
    console.log('Error generating pdf:', error);
    res.status(500).json({
      message: 'Failed to Generate pdf',
      error,
    });
  }
};

const getKYC = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { kycId } = req.params;
		// const userId = req.user.id;

		const kycData = await kycServices.getKycById(kycId);

		res.status(200).json({ data: kycData });
	} catch (error) {
		console.log('Error generating pdf:', error);
		res.status(500).json({
			message: 'Failed to Generate pdf',
			error,
		});
	}
};

module.exports = {
	createKYCRequest,
	getUserKYCDetails,
	getUserKYCRequests,
	verifyDocumentsWithAI,
	assignCase,
	updateCaseStatus,
	getAllKYCRequests,
	handlePDFDownload,
	getKYC,
};
