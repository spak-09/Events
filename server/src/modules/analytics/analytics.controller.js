const analyticsService = require('./analytics.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getEventAnalytics = asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getEventAnalytics(req.params.eventId);
  sendSuccess(res, {
    statusCode: 200,
    data: analytics,
  });
});

const getPlatformOverview = asyncHandler(async (req, res) => {
  const overview = await analyticsService.getPlatformOverview();
  sendSuccess(res, {
    statusCode: 200,
    data: overview,
  });
});

module.exports = {
  getEventAnalytics,
  getPlatformOverview,
};
