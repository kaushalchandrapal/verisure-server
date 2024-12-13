const express = require('express');
const router = express.Router();
const authMiddleware = require('../Auth/middleware');
const { requirePermission } = require('../Role/middleware');
const adminControllers = require('./controllers');
const PERMISSIONS = require('../constants/permissions');

router.get(
	'/counts',
	authMiddleware.auth,
	requirePermission(PERMISSIONS.GET_ANALYTICS),
	adminControllers.getCounts
);

module.exports = router;
