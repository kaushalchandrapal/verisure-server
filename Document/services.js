// services/documentService.js

const { z } = require('zod');
const { zodResponseFormat } = require('openai/helpers/zod');
const DOCUMENT_TYPES = require('../constants/documentTypes');
const Document = require('./model');
const OpenAI = require('openai');

const DocumentFields = z.object({
	name: z.boolean(),
	dob: z.boolean(),
	address: z.boolean(),
	person_image: z.boolean(),
	isTargetDocument: z.boolean(),
	issueDate: z.boolean(),
	expiryDate: z.boolean(),
});

/**
 * Creates a document to the database
 *
 * @param {Object} documentData - The document data object containing type and location
 * @returns {Object} The newly created document entry
 */
const createDocument = async (documentType, documentLocation) => {
	try {
		if (!Object.values(DOCUMENT_TYPES).includes(documentType)) {
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
	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});

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
		const completion = await openai.beta.chat.completions.parse({
			model: 'gpt-4o-2024-08-06',
			messages: [
				{
					role: 'system',
					content: `Analyze the given ${documentType} images to check for real data in the following fields: "name", "dob", "address", "person_image", "issue_date", "expiry_date" (or similar terms such as "valid from," "valid till," etc.) and determine if it is a ${documentType}. For each field, return true if it contains actual data which is readable and not blurry or obscured, otherwise return false. Ensure that fields with synonymous terms are also recognized (e.g., "expiry date" could be labeled as "valid till"). Return true for "isTargetDocument" if it is a ${documentType}, otherwise return false.`,
				},
				{
					role: 'user',
					content: promptDocuments,
				},
			],
			response_format: zodResponseFormat(
				DocumentFields,
				'field_analysis'
			),
		});

		// Extract parsed response from the AI completion
		const fieldAnalysis = completion.choices[0].message.parsed;

		console.log('fieldAnalysis', fieldAnalysis);
		// Validate that each required field in the response is true
		const {
			name,
			dob,
			address,
			person_image,
			isTargetDocument,
			issueDate,
			expiryDate,
		} = fieldAnalysis;
		if (
			!(
				name &&
				dob &&
				address &&
				person_image &&
				isTargetDocument &&
				issueDate &&
				expiryDate
			)
		) {
			let message = '';

			if (!isTargetDocument)
				message += 'The document is not a valid document.';
			else {
				message = 'These fields ';
				if (!name) message += 'name, ';
				if (!dob) message += 'date of birth, ';
				if (!address) message += 'address, ';
				if (!person_image) message += 'person image, ';
				if (!issueDate) message += 'issue date, ';
				if (!expiryDate) message += 'expiry date, ';
				message += 'are missing or not readable in the document.';
			}

			return { status: false, message };
		}
		return { status: true, message: '' };
	} catch (error) {
		console.error(`Error validating document`, error);
		return { status: false, message: 'Something wrong' };
	}
};

module.exports = {
	createDocument,
	validateDocumentWithAI,
};
