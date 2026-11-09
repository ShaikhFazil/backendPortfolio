const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');
const env = require('../config/env');
const { AdminUser } = require('../models');
const { signToken, cookieOptions } = require('../middleware/auth');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await AdminUser.findOne({ email }).select('+passwordHash');

  // Same message either way so the endpoint does not reveal which emails exist.
  if (!user || !(await user.verifyPassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.cookie(env.cookieName, signToken(user), cookieOptions());
  return ok(res, { user: user.toJSON() });
});

const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: undefined });
  return ok(res, { loggedOut: true });
});

const me = asyncHandler(async (req, res) => ok(res, { user: req.user.toJSON() }));

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await AdminUser.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.passwordHash = await AdminUser.hashPassword(newPassword);
  await user.save();
  return ok(res, { updated: true });
});

module.exports = { login, logout, me, changePassword };
