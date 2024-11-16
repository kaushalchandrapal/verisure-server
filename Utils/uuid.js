const { v4: uuidv4 } = require('uuid');

/**
 * Generates a unique UUID v4
 * @returns {String} A unique UUID
 */
const generateUniqueUUID = () => {
	return uuidv4();
};

module.exports = { generateUniqueUUID };
