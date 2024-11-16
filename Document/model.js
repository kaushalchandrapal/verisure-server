const mongoose = require('mongoose');
const DOCUMENT_TYPES = require('../constants/documentTypes');

const DocumentSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			required: true,
			enum: DOCUMENT_TYPES,
		},
		location: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
	}
);

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
