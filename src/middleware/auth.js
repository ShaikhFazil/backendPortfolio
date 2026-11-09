const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { AdminUser } = require('../models');

function readToken(req) {
  if (req.cookies && req.cookies[env.cookieName]) return req.cookies[env.cookieName];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Session expired, please sign in again');
  }

  const user = await AdminUser.findById(payload.sub);
  if (!user) throw ApiError.unauthorized();

  req.user = user;
  next();
});

const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') return next(ApiError.forbidden());
  next();
};

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd || env.cookieCrossSite,
    sameSite: env.cookieCrossSite ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

module.exports = { requireAuth, requireAdmin, signToken, cookieOptions, readToken };
