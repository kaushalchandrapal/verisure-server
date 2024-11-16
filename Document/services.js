// services/documentService.js

const DOCUMENT_TYPES = require('../constants/documentTypes');
const Document = require('../models/Document');

const DocumentFields = z.object({
	name: z.boolean(),
	dob: z.boolean(),
	address: z.boolean(),
	person_image: z.boolean(),
	isTargetDocument: z.boolean(),
});

/**
 * Creates a document to the database
 *
 * @param {Object} documentData - The document data object containing type and location
 * @returns {Object} The newly created document entry
 */
const createDocument = async (documentType, documentLocation) => {
	try {
		if (!(documentType in DOCUMENT_TYPES)) {
			throw new Error('Invalid document type');
		}

		if (!documentLocation) {
			throw new Error('Document location is required');
		}

		// Create a new instance of the Document model
		const document = new Document({
			type: documentType,
			location: documentLocation,
		});

		// Save the document to the database
		const savedDocument = await document.save();

		return savedDocument;
	} catch (error) {
		console.error('Error uploading document:', error);
		throw new Error('Failed to upload document');
	}
};

/**
 * Validates an array of document URLs by sending each document for AI analysis.
 *
 * @param {String} documentType - The type of document to validate (e.g., "passport")
 * @param {Array} documents - An array of document URLs to validate
 * @returns {Boolean} - Returns true if all documents pass validation, otherwise false
 */
const validateDocumentWithAI = async (documentType, documents) => {
	const promptDocuments = [];
	documents.forEach((document_url) =>
		promptDocuments.push({
			type: 'image_url',
			image_url: { url: document_url },
		})
	);

	// Loop through each document URL
	try {
		// Send request to OpenAI API for document analysis
		const completion = await openai.beta.chat.completions.create({
			model: 'gpt-4o-2024-08-06',
			messages: [
				{
					role: 'system',
					content: `Analyze the given ${documentType} images to check for real data in the following fields: "name", "dob", "address", "person_image" and determine if it is a ${documentType}. For each field, return true if it contains actual data which is readable and not blurry or obscured. Return true for "isTargetDocument" if it is a ${documentType}, otherwise return false.`,
				},
				{
					role: 'user',
					content: promptDocuments,
				},
			],
			response_format: 'zod',
		});

		// Extract parsed response from the AI completion
		const fieldAnalysis = completion.choices[0].message.parsed;

		// Validate that each required field in the response is true
		const { name, dob, address, person_image, isTargetDocument } =
			fieldAnalysis;
		if (!(name && dob && address && person_image && isTargetDocument)) {
			return false;
		}
		return true;
	} catch (error) {
		console.error(`Error validating document at ${documentUrl}:`, error);
		return false; // Return false if there’s an error processing the document
	}
};

module.exports = {
	createDocument,
	validateDocumentWithAI,
};
