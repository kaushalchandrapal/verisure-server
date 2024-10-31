const mongoose = require('mongoose');
const PERMISSIONS = require('../constants/permissions');

// Define the schema for the User model
const roleSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		permissions: {
			type: [String],
			enum: Object.values(PERMISSIONS),
		},
	},
	{
		// add automatic timestamps to the schema
		timestamps: { created_at: 'created_at', updated_at: 'updated_at' },
	}
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
