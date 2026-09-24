const announcementsService = require('./announcements.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getEventAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await announcementsService.getEventAnnouncements(req.params.eventId, req.user);
  sendSuccess(res, {
    statusCode: 200,
    data: announcements,
  });
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await announcementsService.getAnnouncementById(
    req.params.eventId,
    req.params.id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: announcement,
  });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementsService.createAnnouncement(
    req.params.eventId,
    req.body,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 201,
    data: announcement,
  });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementsService.updateAnnouncement(
    req.params.eventId,
    req.params.id,
    req.body,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: announcement,
  });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await announcementsService.deleteAnnouncement(
    req.params.eventId,
    req.params.id,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  getEventAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
