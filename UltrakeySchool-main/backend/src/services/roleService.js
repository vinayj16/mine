import Role from '../models/Role.js';

const createRole = async (roleData) => {
  const role = new Role(roleData);
  await role.save();
  return role;
};

const getRoles = async () => {
  return await Role.find();
};

const getAllRoles = async (filters, options) => {
  return { roles: await getRoles(), pagination: {} };
};

const getRoleById = async (id) => {
  return await Role.findById(id);
};

const updateRole = async (id, roleData) => {
  return await Role.findByIdAndUpdate(id, roleData, { new: true });
};

const deleteRole = async (id) => {
  await Role.findByIdAndDelete(id);
};

const getRoleByName = async (name) => {
  return await Role.findOne({ name });
};

const addPermissionToRole = async (roleId, permission) => {
  const role = await getRoleById(roleId);
  if (role) {
    role.permissions.push(permission);
    await role.save();
  }
  return role;
};

const removePermissionFromRole = async (roleId, permission) => {
  const role = await getRoleById(roleId);
  if (role) {
    role.permissions = role.permissions.filter((p) => p !== permission);
    await role.save();
  }
  return role;
};

const initializeRoles = async () => {
  const roles = [
    { name: 'superadmin', description: 'Super Admin' },
    { name: 'admin', description: 'Admin' },
    { name: 'teacher', description: 'Teacher' },
    { name: 'student', description: 'Student' },
    { name: 'parent', description: 'Parent' },
    { name: 'accountant', description: 'Accountant' },
  ];

  for (const roleData of roles) {
    const roleExists = await getRoleByName(roleData.name);
    if (!roleExists) {
      await createRole(roleData);
    }
  }
};

export default {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getRoleByName,
  addPermissionToRole,
  removePermissionFromRole,
  initializeRoles,
};
