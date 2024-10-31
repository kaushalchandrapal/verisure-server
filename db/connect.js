const mongoose = require('mongoose');

/**
 * Function to establish a connection to MongoDB using Mongoose.
 *
 * @returns {Promise} A promise that resolves when the connection is successful, or rejects with an error if the connection fails or the URI is missing.
 */
const connectDB = () => {
	return new Promise(async (resolve, reject) => {
		// Get the MongoDB URI from environment variables
		const mongoUri = process.env.MONGO_URI;

		// If the URI is missing, log an error and reject the promise
		if (!mongoUri) {
			console.error(
				'MongoDB URI is missing in the environment variables'
			);

			return reject(
				new Error(
					'MongoDB URI is required. Please set the MONGO_URI environment variable.'
				)
			);
		}

		try {
			// Connect to MongoDB using Mongoose
			await mongoose.connect(mongoUri);
			return resolve();
		} catch (error) {
			return reject(error);
		}
	});
};

module.exports = { connectDB };
