// services.js
const AWS = require('aws-sdk');

// Initialize S3 client
const s3 = new AWS.S3({
	region: process.env.AWS_REGION, // Set your region in environment variables
	accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set your access key ID in environment variables
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Set your secret access key in environment variables
});

/**
 * Function to generate a presigned URL for uploading a file to S3
 *
 * @param {String} bucketName - The name of the S3 bucket
 * @param {String} key - The key (file path) for the uploaded file
 * @param {Number} [expires=60] - Expiration time in seconds for the presigned URL (default is 60)
 * @returns {Promise<String>} The generated presigned URL
 */
const generatePresignedUrl = async (bucketName, key, expires = 120) => {
	try {
		// Configure the parameters for the presigned URL
		const params = {
			Bucket: bucketName,
			Key: key,
			Expires: expires,
			ContentType: 'image/jpeg',
		};

		// Generate the presigned URL
		const url = await s3.getSignedUrlPromise('putObject', params);

		return url;
	} catch (error) {
		console.error('Error generating presigned URL:', error);
		throw new Error('Could not generate presigned URL');
	}
};

module.exports = {
	generatePresignedUrl,
};
