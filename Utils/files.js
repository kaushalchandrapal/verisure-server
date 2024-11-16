const { v4: uuidv4 } = require('uuid');
const path = require('path');
const uuidUtils = require('./uuid');

/**
 * Appends a unique UUID to the end of a filename while preserving the file extension.
 *
 * @param {String} filename - The original filename
 * @returns {String} The filename with a unique UUID appended
 */
const appendUniqueIdToFilename = (filename) => {
	// Extract the file extension
	const ext = path.extname(filename);
	// Get the base name without the extension
	const baseName = path.basename(filename, ext);
	// Generate a unique UUID
	const uniqueId = uuidUtils.generateUniqueUUID();
	// Append the UUID to the base name and add the extension back
	return `${baseName}-${uniqueId}${ext}`;
};

module.exports = { appendUniqueIdToFilename };
