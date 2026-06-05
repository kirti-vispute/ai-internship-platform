const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/api-response");
const interviewRoomService = require("../services/interview-room.service");
const { isEnabled } = require("../config/feature-flags");
const AppError = require("../utils/AppError");

function ensureInterviewRoomsEnabled() {
  if (!isEnabled("ENABLE_INTERVIEW_ROOMS")) {
    throw new AppError("Interview rooms are disabled", 503);
  }
}

const getRoom = asyncHandler(async (req, res) => {
  ensureInterviewRoomsEnabled();
  const payload = await interviewRoomService.getRoomDetails(req.user, req.params.roomId);
  return sendSuccess(res, { data: payload });
});

const joinRoom = asyncHandler(async (req, res) => {
  ensureInterviewRoomsEnabled();
  const payload = await interviewRoomService.joinRoom(req.user, req.params.roomId);
  return sendSuccess(res, { data: payload });
});

const updateNotes = asyncHandler(async (req, res) => {
  ensureInterviewRoomsEnabled();
  const room = await interviewRoomService.updateHrNotes(req.user, req.params.roomId, req.body?.notes);
  return sendSuccess(res, { data: { room }, message: "Notes saved" });
});

const updateOutcome = asyncHandler(async (req, res) => {
  ensureInterviewRoomsEnabled();
  const room = await interviewRoomService.setOutcome(req.user, req.params.roomId, req.body?.outcome);
  return sendSuccess(res, { data: { room }, message: "Outcome updated" });
});

const endInterview = asyncHandler(async (req, res) => {
  ensureInterviewRoomsEnabled();
  const payload = await interviewRoomService.endInterview(req.user, req.params.roomId);
  return sendSuccess(res, { data: payload, message: "Interview ended" });
});

module.exports = {
  getRoom,
  joinRoom,
  updateNotes,
  updateOutcome,
  endInterview
};
