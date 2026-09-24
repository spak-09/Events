const ticketsService = require('./tickets.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createTicketType = asyncHandler(async (req, res) => {
  const ticket = await ticketsService.createTicketType(req.params.eventId, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: ticket,
  });
});

const listTicketTypes = asyncHandler(async (req, res) => {
  const tickets = await ticketsService.listTicketTypes(req.params.eventId);
  sendSuccess(res, {
    statusCode: 200,
    data: tickets,
  });
});

const getTicketTypeById = asyncHandler(async (req, res) => {
  const ticket = await ticketsService.getTicketTypeById(req.params.eventId, req.params.id);
  sendSuccess(res, {
    statusCode: 200,
    data: ticket,
  });
});

const updateTicketType = asyncHandler(async (req, res) => {
  const ticket = await ticketsService.updateTicketType(
    req.params.eventId,
    req.params.id,
    req.body,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: ticket,
  });
});

const deleteTicketType = asyncHandler(async (req, res) => {
  const result = await ticketsService.deleteTicketType(
    req.params.eventId,
    req.params.id,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await ticketsService.createCoupon(req.params.eventId, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: coupon,
  });
});

const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await ticketsService.listCoupons(req.params.eventId);
  sendSuccess(res, {
    statusCode: 200,
    data: coupons,
  });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const result = await ticketsService.validateCoupon(req.params.eventId, req.body);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  createTicketType,
  listTicketTypes,
  getTicketTypeById,
  updateTicketType,
  deleteTicketType,
  createCoupon,
  listCoupons,
  validateCoupon,
};
