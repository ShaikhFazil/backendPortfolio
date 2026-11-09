const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is larger than the allowed limit'
        : `Upload error: ${err.message}`;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`;
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
    if (env.isProd) message = 'Internal server error';
  }

  res.status(status).json({
    success: false,
    error: { message, ...(details ? { details } : {}) },
  });
}

module.exports = { notFound, errorHandler };
