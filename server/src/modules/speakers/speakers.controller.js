const speakersService = require('./speakers.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createSpeaker = asyncHandler(async (req, res) => {
  const speaker = await speakersService.createSpeaker(req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: speaker,
  });
});

const listSpeakers = asyncHandler(async (req, res) => {
  const result = await speakersService.listSpeakers(req.query);
  sendSuccess(res, {
    statusCode: 200,
    data: result.data,
    meta: result.meta,
  });
});

const getSpeakerById = asyncHandler(async (req, res) => {
  const speaker = await speakersService.getSpeakerById(req.params.id);
  sendSuccess(res, {
    statusCode: 200,
    data: speaker,
  });
});

const updateSpeaker = asyncHandler(async (req, res) => {
  const speaker = await speakersService.updateSpeaker(req.params.id, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: speaker,
  });
});

const deleteSpeaker = asyncHandler(async (req, res) => {
  const result = await speakersService.deleteSpeaker(req.params.id, req.user._id);
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  createSpeaker,
  listSpeakers,
  getSpeakerById,
  updateSpeaker,
  deleteSpeaker,
};
