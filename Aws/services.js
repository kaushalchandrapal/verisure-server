// services.js
const AWS = require('aws-sdk');
const mime = require('mime-types');

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
const generatePresignedUrl = async (bucketName, key, expires = 300) => {
	try {
		// Configure the parameters for the presigned URL
		const params = {
			Bucket: bucketName,
			Key: key,
			Expires: expires,
			ContentType: mime.lookup(key) || 'application/octet-stream', // Set the content type of the file you are uploading
		};

		// Generate the presigned URL
		const url = await s3.getSignedUrlPromise('putObject', params);

		return url;
	} catch (error) {
		console.error('Error generating presigned URL:', error);
		throw new Error('Could not generate presigned URL');
	}
};

/**
 * Function to generate a public URL for an object in S3
 *
 * @param {String} bucketName - The name of the S3 bucket
 * @param {String} key - The key (file path) for the file in the bucket
 * @param {String} region - The region where the bucket is located
 * @returns {String} The generated public URL
 */
const generateImageUrl = (bucketName, region, key) => {
	try {
		// Construct the public URL
		const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
		return url;
	} catch (error) {
		console.error('Error generating image URL:', error);
		throw new Error('Could not generate image URL');
	}
};

module.exports = generateImageUrl;

module.exports = {
	generatePresignedUrl,
	generateImageUrl,
};
