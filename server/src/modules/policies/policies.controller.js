const policiesService = require('./policies.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getAllPolicies = asyncHandler(async (req, res) => {
  const policies = await policiesService.getAllPolicies();
  sendSuccess(res, {
    statusCode: 200,
    data: policies,
  });
});

const setPolicy = asyncHandler(async (req, res) => {
  const policy = await policiesService.setPolicy(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: policy,
  });
});

module.exports = {
  getAllPolicies,
  setPolicy,
};
