const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * 404 Not Found catch-all middleware
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error-handling middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.keys(err.errors || {}).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = `Invalid format for field '${err.path}': ${err.value}`;
    details = [{ field: err.path, value: err.value }];
  }

  // Handle Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate key error: A record with this ${fields.join(', ')} already exists`;
    details = err.keyValue;
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication token has expired';
  }

  // Handle SyntaxError (e.g. invalid JSON in request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Malformed JSON in request body';
  }

  // Log server errors (500)
  if (statusCode >= 500) {
    logger.error({
      err,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      body: req.body,
    }, 'Unhandled Server Error');
  }

  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : { details: null }),
      ...(env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  };

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
