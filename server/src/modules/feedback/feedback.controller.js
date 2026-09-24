const feedbackService = require('./feedback.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const submitFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.submitFeedback(
    req.params.eventId,
    req.user._id,
    req.body
  );
  sendSuccess(res, {
    statusCode: 201,
    data: feedback,
  });
});

const listFeedback = asyncHandler(async (req, res) => {
  const result = await feedbackService.listFeedback(req.params.eventId, req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getFeedbackSummary = asyncHandler(async (req, res) => {
  const summary = await feedbackService.getFeedbackSummary(req.params.eventId);
  sendSuccess(res, {
    statusCode: 200,
    data: summary,
  });
});

module.exports = {
  submitFeedback,
  listFeedback,
  getFeedbackSummary,
};
