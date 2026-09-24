/**
 * Standard response helpers for EventForge.
 * Success: { success: true, data, meta }
 * Error:   { success: false, error: { code, message, details } }
 */

const sendSuccess = (res, { statusCode = 200, data = null, meta = undefined }) => {
  const payload = {
    success: true,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (res, { statusCode = 500, code = 'INTERNAL_SERVER_ERROR', message = 'Internal server error', details = null }) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
