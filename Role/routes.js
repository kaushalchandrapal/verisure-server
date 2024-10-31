const express = require('express');
const router = express.Router();
const authMiddleware = require('../Auth/middleware');
const { getAllRoles } = require('./services');
const { requirePermission } = require('./middleware');
const PERMISSIONS = require('../constants/permissions');

router.get('/roles', authMiddleware.auth, requirePermission(PERMISSIONS.VIEW_ROLES), async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
