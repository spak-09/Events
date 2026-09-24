const aiService = require('./ai.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const generateEventDescription = asyncHandler(async (req, res) => {
  const result = await aiService.generateEventDescription(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const generateSpeakerBio = asyncHandler(async (req, res) => {
  const result = await aiService.generateSpeakerBio(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const generateAnnouncement = asyncHandler(async (req, res) => {
  const result = await aiService.generateAnnouncement(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const generateSessionSummary = asyncHandler(async (req, res) => {
  const result = await aiService.generateSessionSummary(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const recommendations = await aiService.getHybridRecommendations(
    req.params.id,
    req.user._id,
    limit
  );
  sendSuccess(res, {
    statusCode: 200,
    data: recommendations,
  });
});

module.exports = {
  generateEventDescription,
  generateSpeakerBio,
  generateAnnouncement,
  generateSessionSummary,
  getRecommendations,
};
