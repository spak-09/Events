/**
 * Pagination, sorting, searching, and filtering utility.
 */

const getPaginationParams = (query, defaultSort = 'createdAt', defaultOrder = 'desc') => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return { page, limit, skip, sort, sortBy, sortOrder };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Executes a paginated Mongoose query.
 * @param {import('mongoose').Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} queryParams - Express req.query
 * @param {Object} options - populate, select, defaultSort
 */
const paginateQuery = async (model, filter = {}, queryParams = {}, options = {}) => {
  const { page, limit, skip, sort } = getPaginationParams(
    queryParams,
    options.defaultSort || 'createdAt',
    options.defaultOrder || 'desc'
  );

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter).exec(),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return { data, meta };
};

module.exports = {
  getPaginationParams,
  buildPaginationMeta,
  paginateQuery,
};
