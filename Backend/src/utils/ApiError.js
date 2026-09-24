/**
 * Custom operational API Error class with standardized error codes and details.
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = null) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static validationError(message = 'Validation failed', details = null) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Unauthorized: Authentication required', details = null) {
    return new ApiError(401, 'UNAUTHORIZED', message, details);
  }

  static forbidden(message = 'Forbidden: Insufficient permissions', details = null) {
    return new ApiError(403, 'FORBIDDEN', message, details);
  }

  static notFound(message = 'Resource not found', details = null) {
    return new ApiError(404, 'NOT_FOUND', message, details);
  }

  static conflict(message = 'Resource conflict or duplicate entry', details = null) {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static scheduleConflict(message = 'Schedule conflict detected', details = null) {
    return new ApiError(409, 'SCHEDULE_CONFLICT', message, details);
  }

  static rateLimited(message = 'Too many requests. Please try again later.', details = null) {
    return new ApiError(429, 'RATE_LIMITED', message, details);
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(500, 'INTERNAL_SERVER_ERROR', message, details, false);
  }
}

module.exports = ApiError;
