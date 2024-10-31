const mongoose = require('mongoose');

// Define the schema for the User model
const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		password_hash: {
			type: String,
			required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		email_verified: {
			type: Boolean,
			default: false,
		},
		role: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Role',
			required: true,
		},
	},
	{
		// add automatic timestamps to the schema
		timestamps: { created_at: 'created_at', updated_at: 'updated_at' },
	}
);

const User = mongoose.model('User', userSchema);

module.exports = User;
