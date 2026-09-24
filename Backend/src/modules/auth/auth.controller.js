const env = require('../../config/env');
const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body,
    req.ip,
    req.get('user-agent')
  );

  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  sendSuccess(res, {
    statusCode: 201,
    data: {
      user,
      accessToken,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(
    req.body,
    req.ip,
    req.get('user-agent')
  );

  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  sendSuccess(res, {
    statusCode: 200,
    data: {
      user,
      accessToken,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const tokenString = req.cookies?.refreshToken || req.body?.refreshToken;
  const { user, accessToken, refreshToken } = await authService.rotateRefreshToken(
    tokenString,
    req.ip,
    req.get('user-agent')
  );

  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());

  sendSuccess(res, {
    statusCode: 200,
    data: {
      user,
      accessToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  const tokenString = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logoutUser(tokenString);

  // eslint-disable-next-line no-unused-vars
  const { maxAge, ...clearOptions } = getRefreshTokenCookieOptions();
  res.clearCookie('refreshToken', clearOptions);

  sendSuccess(res, {
    statusCode: 200,
    data: { message: 'Logged out successfully' },
  });
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.getCurrentUserProfile(req.user._id);

  sendSuccess(res, {
    statusCode: 200,
    data: profile,
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body.token, req.body.newPassword);

  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
