const { storage } = require('../../utils/storage');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file provided in the request');
  }

  const fileData = await storage.save(req.file);

  sendSuccess(res, {
    statusCode: 201,
    data: fileData,
  });
});

module.exports = {
  uploadFile,
};
