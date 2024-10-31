const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.GMAIL_USER,
		pass: process.env.GMAIL_PASS,
	},
});

/**
 * Sends an email using the Gmail SMTP server.
 * @param {String} email
 * @param {String} subject
 * @param {String} text
 */
const sendEmail = async (email, subject, text) => {
	try {
		// Check if email is provided
		if (!email) {
			throw new Error('Email is required to send an email.');
		}

		// Send email
		return await transporter.sendMail({
			from: process.env.GMAIL_USER,
			to: email,
			subject,
			text,
		});
	} catch (error) {
		throw new Error(error);
	}
};

module.exports = {
	sendEmail,
};
