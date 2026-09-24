const sessionsService = require('./sessions.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createSession = asyncHandler(async (req, res) => {
  const session = await sessionsService.createSession(req.params.eventId, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: session,
  });
});

const updateSession = asyncHandler(async (req, res) => {
  const session = await sessionsService.updateSession(
    req.params.eventId,
    req.params.id,
    req.body,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: session,
  });
});

const deleteSession = asyncHandler(async (req, res) => {
  const result = await sessionsService.deleteSession(
    req.params.eventId,
    req.params.id,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const checkConflicts = asyncHandler(async (req, res) => {
  const report = await sessionsService.checkSchedulingConflicts(req.params.eventId, req.body);
  sendSuccess(res, {
    statusCode: 200,
    data: report,
  });
});

const listSessions = asyncHandler(async (req, res) => {
  const result = await sessionsService.listSessions(req.params.eventId, req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getSessionById = asyncHandler(async (req, res) => {
  const session = await sessionsService.getSessionById(req.params.eventId, req.params.id);
  sendSuccess(res, {
    statusCode: 200,
    data: session,
  });
});

module.exports = {
  createSession,
  updateSession,
  deleteSession,
  checkConflicts,
  listSessions,
  getSessionById,
};
