const { createRole, getAllRoles } = require('../services');

const createRoleController = async (req, res) => {
  const { roleName, permissions } = req.body;
  try {
    const role = await createRole(roleName, permissions);
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllRolesController = async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRoleController,
  getAllRolesController,
};