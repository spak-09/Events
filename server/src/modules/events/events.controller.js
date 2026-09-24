const eventsService = require('./events.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.createEvent(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: event,
  });
});

const listEvents = asyncHandler(async (req, res) => {
  const result = await eventsService.listEvents(req.query, req.user);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventsService.getEventById(req.params.id, req.user);
  sendSuccess(res, {
    statusCode: 200,
    data: event,
  });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.updateEvent(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: event,
  });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const result = await eventsService.deleteEvent(req.params.id, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const publishEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.publishEvent(req.params.id, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: event,
  });
});

const cancelEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.cancelEvent(req.params.id, req.body.reason, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: event,
  });
});

const duplicateEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.duplicateEvent(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: event,
  });
});

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  cancelEvent,
  duplicateEvent,
};
