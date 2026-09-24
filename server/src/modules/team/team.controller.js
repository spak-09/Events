const teamService = require('./team.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getEventTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getEventTeam(req.params.eventId);
  sendSuccess(res, {
    statusCode: 200,
    data: team,
  });
});

const assignTeamMember = asyncHandler(async (req, res) => {
  const member = await teamService.assignTeamMember(req.params.eventId, req.body, req.user._id);
  sendSuccess(res, {
    statusCode: 201,
    data: member,
  });
});

const updateTeamMember = asyncHandler(async (req, res) => {
  const member = await teamService.updateTeamMember(
    req.params.eventId,
    req.params.memberId,
    req.body,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: member,
  });
});

const removeTeamMember = asyncHandler(async (req, res) => {
  const result = await teamService.removeTeamMember(
    req.params.eventId,
    req.params.memberId,
    req.user._id
  );
  sendSuccess(res, {
    statusCode: 200,
    data: result,
  });
});

module.exports = {
  getEventTeam,
  assignTeamMember,
  updateTeamMember,
  removeTeamMember,
};
