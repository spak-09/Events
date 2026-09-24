const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { paginateQuery } = require('../../utils/pagination');

const listUsers = async (queryParams) => {
  const filter = {};

  if (queryParams.search) {
    filter.$or = [
      { name: { $regex: queryParams.search, $options: 'i' } },
      { email: { $regex: queryParams.search, $options: 'i' } },
    ];
  }

  if (queryParams.globalRole) {
    filter.globalRole = queryParams.globalRole;
  }

  if (queryParams.isActive !== undefined) {
    filter.isActive = queryParams.isActive;
  }

  return paginateQuery(User, filter, queryParams);
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

const updateUser = async (id, updateData, actorId) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (updateData.name !== undefined) user.name = updateData.name;
  if (updateData.phone !== undefined) user.phone = updateData.phone;
  if (updateData.avatar !== undefined) user.avatar = updateData.avatar;

  await user.save();

  await AuditLog.create({
    user: actorId,
    action: 'USER_UPDATED',
    resource: 'User',
    resourceId: user._id.toString(),
    details: updateData,
  });

  return user;
};

const updateUserStatus = async (id, { isActive, reason }, actorId) => {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.isActive = isActive;
  await user.save();

  await AuditLog.create({
    user: actorId,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    resource: 'User',
    resourceId: user._id.toString(),
    details: { isActive, reason },
  });

  return user;
};

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};
