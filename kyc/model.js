const mongoose = require('mongoose');

const KYCRequestSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		status: {
			type: String,
			required: true,
			enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
		},
		documents: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Document',
				required: true,
			},
		],
		assigner_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			index: true
		},
		worker_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			index: true
		},
		valid_until: {
			type: Date,
			default: null, // Set when status is marked as "Completed"
		},
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
	}
);

const KYCRequest = mongoose.model('KYCRequest', KYCRequestSchema);

module.exports = KYCRequest;
