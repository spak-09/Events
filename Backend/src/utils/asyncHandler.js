/**
 * Wraps asynchronous route handler functions to automatically catch and forward errors to Express next().
 * @param {Function} fn - Async express route handler function
 * @returns {Function} Express middleware handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
