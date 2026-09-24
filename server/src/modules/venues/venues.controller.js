const venuesService = require('./venues.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createVenue = asyncHandler(async (req, res) => {
  const venue = await venuesService.createVenue(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: venue,
  });
});

const listVenues = asyncHandler(async (req, res) => {
  const result = await venuesService.listVenues(req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getVenueById = asyncHandler(async (req, res) => {
  const venue = await venuesService.getVenueById(req.params.id);
  sendSuccess(res, {
    statusCode: 200,
    data: venue,
  });
});

const updateVenue = asyncHandler(async (req, res) => {
  const venue = await venuesService.updateVenue(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: venue,
  });
});

const deleteVenue = asyncHandler(async (req, res) => {
  const result = await venuesService.deleteVenue(req.params.id, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const addRoom = asyncHandler(async (req, res) => {
  const room = await venuesService.addRoom(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: room,
  });
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await venuesService.updateRoom(req.params.id, req.params.roomId, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: room,
  });
});

const deleteRoom = asyncHandler(async (req, res) => {
  const result = await venuesService.deleteRoom(req.params.id, req.params.roomId, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  createVenue,
  listVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  addRoom,
  updateRoom,
  deleteRoom,
};
