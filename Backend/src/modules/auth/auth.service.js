const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { GLOBAL_ROLES } = require('../../config/roles');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const EventMember = require('../../models/EventMember');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');

/**
 * Generates an Access Token (short-lived) and Refresh Token (long-lived).
 */
const generateAuthTokens = async (user, ipAddress = null, userAgent = null) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    globalRole: user.globalRole,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION,
  });

  const refreshTokenString = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshTokenDoc = await RefreshToken.create({
    user: user._id,
    token: refreshTokenString,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: refreshTokenDoc.token,
    refreshTokenDoc,
  };
};

/**
 * Register a new user.
 */
const registerUser = async ({ name, email, password, phone }, ipAddress, userAgent) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists');
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    phone: phone || null,
    globalRole: GLOBAL_ROLES.USER,
  });

  const tokens = await generateAuthTokens(user, ipAddress, userAgent);

  await AuditLog.create({
    user: user._id,
    action: 'USER_REGISTERED',
    resource: 'User',
    resourceId: user._id.toString(),
    details: { email: user.email },
    ip: ipAddress,
    userAgent,
  });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

/**
 * Authenticate credentials and issue tokens.
 */
const loginUser = async ({ email, password }, ipAddress, userAgent) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
  }

  const tokens = await generateAuthTokens(user, ipAddress, userAgent);

  await AuditLog.create({
    user: user._id,
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: user._id.toString(),
    ip: ipAddress,
    userAgent,
  });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

/**
 * Rotate refresh token and issue a new access token.
 */
const rotateRefreshToken = async (tokenString, ipAddress, userAgent) => {
  if (!tokenString) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const existingToken = await RefreshToken.findOne({ token: tokenString });

  if (!existingToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Token reuse detection: if a revoked token is used, compromise is suspected.
  // Revoke all tokens in this user's family.
  if (existingToken.revoked) {
    await RefreshToken.updateMany({ user: existingToken.user }, { revoked: true });
    throw ApiError.unauthorized('Security alert: Revoked refresh token reused. All sessions terminated.');
  }

  if (new Date() > existingToken.expiresAt) {
    throw ApiError.unauthorized('Refresh token has expired');
  }

  const user = await User.findById(existingToken.user);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or deactivated');
  }

  // Generate new token pair
  const tokens = await generateAuthTokens(user, ipAddress, userAgent);

  // Mark previous token as revoked and record rotation link
  existingToken.revoked = true;
  existingToken.replacedByToken = tokens.refreshToken;
  await existingToken.save();

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

/**
 * Revoke refresh token (logout).
 */
const logoutUser = async (tokenString) => {
  if (tokenString) {
    await RefreshToken.findOneAndUpdate(
      { token: tokenString },
      { revoked: true }
    );
  }
  return { message: 'Logged out successfully' };
};

/**
 * Get current authenticated user profile along with active event memberships.
 */
const getCurrentUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const memberships = await EventMember.find({
    user: userId,
    status: 'active',
  })
    .populate('event', 'title slug status startDate endDate venue')
    .sort({ createdAt: -1 });

  return {
    user,
    eventMemberships: memberships.map((m) => ({
      membershipId: m._id,
      role: m.role,
      status: m.status,
      event: m.event,
    })),
  };
};

/**
 * Forgot password request.
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    // Return generic success to prevent email enumeration
    return { message: 'If an account exists with this email, a password reset link has been dispatched.' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  return {
    message: 'If an account exists with this email, a password reset link has been dispatched.',
    // Returned in development / test for verification
    resetToken: env.NODE_ENV !== 'production' ? resetToken : undefined,
  };
};

/**
 * Reset password with token.
 */
const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+passwordHash +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Invalidate all active refresh tokens upon password reset
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });

  return { message: 'Password has been reset successfully' };
};

module.exports = {
  generateAuthTokens,
  registerUser,
  loginUser,
  rotateRefreshToken,
  logoutUser,
  getCurrentUserProfile,
  forgotPassword,
  resetPassword,
};
