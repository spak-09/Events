const ApiError = require('../utils/ApiError');

/**
 * Express middleware for validating request data against Zod schemas.
 * Supports both a full Zod schema (e.g. z.object({ body, query, params }))
 * and an object dictionary { body: z.ZodSchema, query: z.ZodSchema, params: z.ZodSchema }.
 *
 * @param {import('zod').ZodSchema | Object} schemas
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const errorDetails = [];

    // 1. If schemas is a Zod schema instance
    if (schemas && typeof schemas.safeParse === 'function') {
      const dataToValidate = {};
      if (req.body !== undefined) dataToValidate.body = req.body;
      if (req.query !== undefined) dataToValidate.query = req.query;
      if (req.params !== undefined) dataToValidate.params = req.params;

      const result = schemas.safeParse(dataToValidate);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const fieldPath = issue.path.join('.');
          errorDetails.push({
            field: fieldPath,
            message: issue.message,
            code: issue.code,
          });
        });

        return next(ApiError.validationError('Validation failed for request data', errorDetails));
      }

      if (result.data) {
        if (result.data.body !== undefined) req.body = result.data.body;
        if (result.data.query !== undefined) req.query = result.data.query;
        if (result.data.params !== undefined) req.params = result.data.params;
      }

      return next();
    }

    // 2. If schemas is an object with { body?, query?, params? }
    ['params', 'query', 'body'].forEach((location) => {
      const schema = schemas[location] || schemas.shape?.[location];
      if (!schema) return;

      const result = schema.safeParse(req[location]);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const fieldPath = [location, ...issue.path].join('.');
          errorDetails.push({
            field: fieldPath,
            message: issue.message,
            code: issue.code,
          });
        });
      } else {
        req[location] = result.data;
      }
    });

    if (errorDetails.length > 0) {
      return next(ApiError.validationError('Validation failed for request data', errorDetails));
    }

    next();
  };
};

module.exports = validate;
