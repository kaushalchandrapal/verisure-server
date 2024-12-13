require('dotenv').config();
const express = require('express');
const app = express();
const dbHelper = require('./db/connect');
const userRoutes = require('./User/routes');
const authRoutes = require('./Auth/routes');
const rolesRoutes = require('./Role/routes');
const kycRoutes = require('./kyc/routes');
const awsRoutes = require('./Aws/routes');
const adminRouters = require('./Admin/routes');
const { addPermissions } = require('./Role/services');
const PERMISSIONS = require('./constants/permissions');
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/role', rolesRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/aws', awsRoutes);
app.use('/api/admin', adminRouters);

app.get('/', (req, res) => {
	res.send({ message: 'Hello API' });
});

(async () => {
	try {
		// connect database
		await dbHelper.connectDB();
		console.log('Database connection successful');

		// start server
		app.listen(port, () => {
			console.log(`Server is running at port ${port}`);

			// addPermissions("Admin", [PERMISSIONS.GET_ANALYTICS])
		});
	} catch (error) {
		console.log(error);
	}
})();
