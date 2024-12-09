const { validationResult } = require('express-validator');
const awsServices = require('./services.js');
const fileUtils = require('../Utils/files.js');

const getMultiplePresignedUrls = async (req, res) => {
	const bucketName = process.env.AWS_BUCKET_NAME;

	// Handle validation errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { fileNames } = req.body;

		const uniqueFileNames = fileNames.map((filename) =>
			fileUtils.appendUniqueIdToFilename(filename)
		);

		// Generate presigned URLs for each filename
		const presignedUrls = await Promise.all(
			uniqueFileNames.map((fileName) =>
				awsServices.generatePresignedUrl(bucketName, fileName)
			)
		);

		const data = [];
		for (let i = 0; i < uniqueFileNames.length; i++) {
			data.push({
				fileName: uniqueFileNames[i],
				url: presignedUrls[i],
			});
		}

		return res.status(200).json(data);
	} catch (error) {
		console.error('Error generating presigned URLs:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
};

module.exports = {
	getMultiplePresignedUrls,
};
