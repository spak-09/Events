const usersService = require('./users.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const { GLOBAL_ROLES } = require('../../config/roles');

const listUsers = asyncHandler(async (req, res) => {
  const result = await usersService.listUsers(req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  sendSuccess(res, {
    statusCode: 200,
    data: user,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  // Allow self-update or platform admin update
  if (req.user.globalRole !== GLOBAL_ROLES.PLATFORM_ADMIN && req.user._id.toString() !== req.params.id) {
    throw ApiError.forbidden('You can only update your own profile');
  }

  const updatedUser = await usersService.updateUser(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: updatedUser,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const updatedUser = await usersService.updateUserStatus(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: updatedUser,
  });
});

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};
