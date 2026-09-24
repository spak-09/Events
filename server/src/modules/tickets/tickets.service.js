const TicketType = require('../../models/TicketType');
const Coupon = require('../../models/Coupon');
const Event = require('../../models/Event');
const AuditLog = require('../../models/AuditLog');
const ApiError = require('../../utils/ApiError');
const { COUPON_TYPE } = require('../../config/roles');

const createTicketType = async (eventId, data, actorId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const ticketType = await TicketType.create({
    ...data,
    event: eventId,
    sold: 0,
  });

  await AuditLog.create({
    user: actorId,
    action: 'TICKET_TYPE_CREATED',
    resource: 'TicketType',
    resourceId: ticketType._id.toString(),
    details: { eventId, name: ticketType.name, price: ticketType.price, capacity: ticketType.capacity },
  });

  return ticketType;
};

const listTicketTypes = async (eventId) => {
  return TicketType.find({ event: eventId }).sort({ price: 1, createdAt: 1 });
};

const getTicketTypeById = async (eventId, id) => {
  const ticket = await TicketType.findOne({ _id: id, event: eventId });
  if (!ticket) {
    throw ApiError.notFound('Ticket type not found for this event');
  }
  return ticket;
};

const updateTicketType = async (eventId, id, updateData, actorId) => {
  const ticket = await TicketType.findOne({ _id: id, event: eventId });
  if (!ticket) {
    throw ApiError.notFound('Ticket type not found');
  }

  // Cannot reduce capacity below already sold
  if (updateData.capacity !== undefined && updateData.capacity < ticket.sold) {
    throw ApiError.badRequest(`Capacity cannot be reduced below already sold tickets (${ticket.sold})`);
  }

  Object.assign(ticket, updateData);
  await ticket.save();

  await AuditLog.create({
    user: actorId,
    action: 'TICKET_TYPE_UPDATED',
    resource: 'TicketType',
    resourceId: ticket._id.toString(),
    details: updateData,
  });

  return ticket;
};

const deleteTicketType = async (eventId, id, actorId) => {
  const ticket = await TicketType.findOne({ _id: id, event: eventId });
  if (!ticket) {
    throw ApiError.notFound('Ticket type not found');
  }

  if (ticket.sold > 0) {
    throw ApiError.badRequest(`Cannot delete ticket type with ${ticket.sold} existing sold registration(s)`);
  }

  await TicketType.findByIdAndDelete(id);

  await AuditLog.create({
    user: actorId,
    action: 'TICKET_TYPE_DELETED',
    resource: 'TicketType',
    resourceId: id,
    details: { eventId, name: ticket.name },
  });

  return { message: 'Ticket type deleted successfully' };
};

const createCoupon = async (eventId, data, actorId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const existing = await Coupon.findOne({ event: eventId, code: data.code.toUpperCase() });
  if (existing) {
    throw ApiError.conflict('A coupon with this code already exists for this event');
  }

  const coupon = await Coupon.create({
    ...data,
    event: eventId,
    code: data.code.toUpperCase(),
    used: 0,
  });

  await AuditLog.create({
    user: actorId,
    action: 'COUPON_CREATED',
    resource: 'Coupon',
    resourceId: coupon._id.toString(),
    details: { eventId, code: coupon.code, value: coupon.value, type: coupon.type },
  });

  return coupon;
};

const listCoupons = async (eventId) => {
  return Coupon.find({ event: eventId }).populate('ticketTypes', 'name price').sort({ createdAt: -1 });
};

const validateCoupon = async (eventId, { code, ticketTypeId }) => {
  const ticket = await TicketType.findOne({ _id: ticketTypeId, event: eventId });
  if (!ticket) {
    throw ApiError.notFound('Ticket type not found');
  }

  const coupon = await Coupon.findOne({
    event: eventId,
    code: code.toUpperCase(),
  });

  if (!coupon) {
    throw ApiError.notFound('Invalid coupon code');
  }

  if (new Date() > new Date(coupon.expiry)) {
    throw ApiError.badRequest('Coupon has expired');
  }

  if (coupon.used >= coupon.maxUses) {
    throw ApiError.badRequest('Coupon usage limit has been reached');
  }

  if (coupon.ticketTypes && coupon.ticketTypes.length > 0) {
    const applicable = coupon.ticketTypes.some((t) => t.toString() === ticketTypeId);
    if (!applicable) {
      throw ApiError.badRequest('Coupon is not applicable to this ticket type');
    }
  }

  let discountAmount = 0;
  if (coupon.type === COUPON_TYPE.PERCENT) {
    discountAmount = (ticket.price * coupon.value) / 100;
  } else {
    discountAmount = Math.min(ticket.price, coupon.value);
  }

  const finalPrice = Math.max(0, ticket.price - discountAmount);

  return {
    valid: true,
    coupon: {
      id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    },
    originalPrice: ticket.price,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
  };
};

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
