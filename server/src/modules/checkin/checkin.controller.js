const checkinService = require('./checkin.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const checkinEvent = asyncHandler(async (req, res) => {
  const result = await checkinService.checkinToEvent(req.body.eventId, req.body, req.user);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const checkinSession = asyncHandler(async (req, res) => {
  const result = await checkinService.checkinToSession(req.body.eventId, req.body, req.user);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const getLiveAttendance = asyncHandler(async (req, res) => {
  const counters = await checkinService.getLiveAttendanceCounters(req.params.eventId);
  sendSuccess(res, {
    statusCode: 200,
    data: counters,
  });
});

module.exports = {
  checkinEvent,
  checkinSession,
  getLiveAttendance,
};
