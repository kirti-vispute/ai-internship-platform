const crypto = require("crypto");
const InterviewRoom = require("../models/InterviewRoom");
const Application = require("../models/Application");
const InternProfile = require("../models/InternProfile");
const CompanyProfile = require("../models/CompanyProfile");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { APPLICATION_STATUS } = require("../constants/enums");
const companyQuery = require("./company-query.service");
const { isHrScopedUser } = require("./company-access.service");

const EARLY_JOIN_MINUTES = 15;
const LATE_JOIN_HOURS = 3;

function combineScheduledTime(interviewDate, interviewTime) {
  const date = new Date(interviewDate);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid interview date", 400);
  }
  const parts = String(interviewTime || "00:00").split(":");
  const hours = Number(parts[0]) || 0;
  const minutes = Number(parts[1]) || 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function getAccessWindow(scheduledTime) {
  const start = new Date(scheduledTime).getTime() - EARLY_JOIN_MINUTES * 60 * 1000;
  const end = new Date(scheduledTime).getTime() + LATE_JOIN_HOURS * 60 * 60 * 1000;
  return { start, end };
}

function isWithinAccessWindow(room, now = Date.now()) {
  const { start, end } = getAccessWindow(room.scheduledTime);
  if (room.status === "live") {
    return now <= end;
  }
  if (room.status === "completed") {
    return false;
  }
  return now >= start && now <= end;
}

async function getCompanyProfileByUserId(userId) {
  const user = await User.findById(userId).select("companyProfileRef");
  if (user?.companyProfileRef) {
    const linked = await CompanyProfile.findById(user.companyProfileRef);
    if (linked) return linked;
  }
  const company = await CompanyProfile.findOne({ user: userId });
  if (!company) {
    throw new AppError("Company profile not found", 404);
  }
  return company;
}

async function getInternProfileByUserId(userId) {
  const profile = await InternProfile.findOne({ user: userId });
  if (!profile) {
    throw new AppError("Intern profile not found", 404);
  }
  return profile;
}

async function assertRoomParticipant(user, room) {
  if (user.role === "intern") {
    const profile = await getInternProfileByUserId(user._id);
    if (String(profile._id) !== String(room.candidateId)) {
      throw new AppError("You are not invited to this interview room", 403);
    }
    return { role: "intern", profile };
  }

  if (user.role === "company") {
    const company = await getCompanyProfileByUserId(user._id);
    if (String(company._id) !== String(room.companyId)) {
      throw new AppError("You are not invited to this interview room", 403);
    }

    const application = await Application.findById(room.applicationId).select("assignedRecruiter companyId");
    if (!application) {
      throw new AppError("Application not found", 404);
    }
    if (String(application.companyId || application.company) !== String(room.companyId)) {
      throw new AppError("Not allowed for this interview", 403);
    }
    if (
      isHrScopedUser(user) &&
      application.assignedRecruiter &&
      String(application.assignedRecruiter) !== String(user._id)
    ) {
      throw new AppError("Not allowed for this recruiter scope", 403);
    }

    return { role: "company", company };
  }

  throw new AppError("Forbidden", 403);
}

async function findRoomByRoomId(roomId) {
  const room = await InterviewRoom.findOne({ roomId: String(roomId || "").trim() });
  if (!room) {
    throw new AppError("Interview room not found", 404);
  }
  return room;
}

async function createRoomForRound({ application, round, roundType }) {
  const scheduledTime = combineScheduledTime(round.interviewDate, round.interviewTime);
  const roomId = crypto.randomUUID();

  const room = await InterviewRoom.create({
    roomId,
    applicationId: application._id,
    roundId: round._id,
    candidateId: application.internId || application.intern,
    companyId: application.companyId || application.company,
    scheduledTime,
    status: "scheduled",
    roundType: String(roundType || round.roundType || "").trim()
  });

  return room;
}

function resolveClientInterviewUrl(roomId) {
  const configured = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)[0];
  const base = configured || "http://localhost:3000";
  return `${base.replace(/\/+$/, "")}/interview/${roomId}`;
}

async function getRoomDetails(user, roomId) {
  const room = await findRoomByRoomId(roomId);
  await assertRoomParticipant(user, room);

  if (!isWithinAccessWindow(room)) {
    if (room.status === "completed") {
      throw new AppError("This interview has already ended", 403);
    }
    const { start } = getAccessWindow(room.scheduledTime);
    if (Date.now() < start) {
      throw new AppError("Interview room is not open yet. Please join at the scheduled time.", 403);
    }
    throw new AppError("Interview room access window has expired", 403);
  }

  const application = await Application.findById(room.applicationId)
    .populate("intern", "fullName email mobile skills education projects summary experience links")
    .populate("internship", "role department location")
    .populate("company", "companyName companyEmail");

  const participant = await assertRoomParticipant(user, room);

  return {
    room: serializeRoom(room, participant.role),
    application: application ? application.toObject() : null,
    participantRole: participant.role
  };
}

function serializeRoom(room, viewerRole) {
  const payload = {
    roomId: room.roomId,
    applicationId: room.applicationId,
    roundId: room.roundId,
    candidateId: room.candidateId,
    companyId: room.companyId,
    scheduledTime: room.scheduledTime,
    status: room.status,
    roundType: room.roundType,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
    outcome: room.outcome || null,
    chatMessages: room.chatMessages || []
  };

  if (viewerRole === "company") {
    payload.hrNotes = room.hrNotes || "";
  }

  return payload;
}

async function joinRoom(user, roomId) {
  const room = await findRoomByRoomId(roomId);
  const participant = await assertRoomParticipant(user, room);

  if (!isWithinAccessWindow(room)) {
    if (room.status === "completed") {
      throw new AppError("This interview has already ended", 403);
    }
    const { start } = getAccessWindow(room.scheduledTime);
    if (Date.now() < start) {
      throw new AppError("Interview room is not open yet. Please join at the scheduled time.", 403);
    }
    throw new AppError("Interview room access window has expired", 403);
  }

  if (room.status === "scheduled") {
    room.status = "live";
    room.startedAt = new Date();
    await room.save();
  }

  return {
    room: serializeRoom(room, participant.role),
    participantRole: participant.role,
    isInitiator: participant.role === "company"
  };
}

async function updateHrNotes(user, roomId, notes) {
  const room = await findRoomByRoomId(roomId);
  const participant = await assertRoomParticipant(user, room);
  if (participant.role !== "company") {
    throw new AppError("Only HR can update interview notes", 403);
  }
  if (room.status === "completed") {
    throw new AppError("Interview is already completed", 400);
  }

  room.hrNotes = String(notes || "");
  await room.save();
  return serializeRoom(room, "company");
}

async function setOutcome(user, roomId, outcome) {
  const normalized = String(outcome || "").trim().toLowerCase();
  if (!["selected", "rejected", "on_hold"].includes(normalized)) {
    throw new AppError("outcome must be selected, rejected, or on_hold", 400);
  }

  const room = await findRoomByRoomId(roomId);
  const participant = await assertRoomParticipant(user, room);
  if (participant.role !== "company") {
    throw new AppError("Only HR can set interview outcome", 403);
  }
  if (room.status === "completed") {
    throw new AppError("Interview is already completed", 400);
  }

  room.outcome = normalized;
  await room.save();
  return serializeRoom(room, "company");
}

async function endInterview(user, roomId) {
  const room = await findRoomByRoomId(roomId);
  const participant = await assertRoomParticipant(user, room);
  if (participant.role !== "company") {
    throw new AppError("Only HR can end the interview", 403);
  }
  if (room.status === "completed") {
    return serializeRoom(room, "company");
  }

  room.status = "completed";
  room.endedAt = new Date();
  await room.save();

  const application = await companyQuery.findApplicationById(
    room.companyId,
    room.applicationId,
    user,
    "internship"
  );

  const round = (application.interviewRounds || []).id(room.roundId);
  if (round) {
    round.status = "completed";
    round.updatedAt = new Date();
  }

  if (room.outcome === "selected") {
    application.status = APPLICATION_STATUS.SELECTED;
    application.stageHistory.push({ stage: APPLICATION_STATUS.SELECTED, note: "Selected after interview" });
  } else if (room.outcome === "rejected") {
    application.status = APPLICATION_STATUS.REJECTED;
    application.stageHistory.push({ stage: APPLICATION_STATUS.REJECTED, note: "Rejected after interview" });
    if (round) round.status = "rejected";
  } else if (room.outcome === "on_hold") {
    application.status = APPLICATION_STATUS.ON_HOLD;
    application.stageHistory.push({ stage: APPLICATION_STATUS.ON_HOLD, note: "Candidate placed on hold after interview" });
  } else {
    application.status = APPLICATION_STATUS.INTERVIEW_COMPLETED;
    application.stageHistory.push({ stage: APPLICATION_STATUS.INTERVIEW_COMPLETED, note: "Interview round completed" });
  }

  await application.save();

  return {
    room: serializeRoom(room, "company"),
    application
  };
}

async function appendChatMessage(user, roomId, body) {
  const room = await findRoomByRoomId(roomId);
  const participant = await assertRoomParticipant(user, room);

  if (!isWithinAccessWindow(room) || room.status === "completed") {
    throw new AppError("Interview chat is closed", 403);
  }

  let senderName = user.email || "Participant";
  if (participant.role === "intern" && participant.profile?.fullName) {
    senderName = participant.profile.fullName;
  }
  if (participant.role === "company" && participant.company?.companyName) {
    senderName = participant.company.companyName;
  }

  const message = {
    senderRole: participant.role,
    senderName,
    body: String(body || "").trim(),
    createdAt: new Date()
  };

  if (!message.body) {
    throw new AppError("Message body is required", 400);
  }

  room.chatMessages.push(message);
  await room.save();

  const saved = room.chatMessages[room.chatMessages.length - 1];
  return {
    _id: saved._id,
    senderRole: saved.senderRole,
    senderName: saved.senderName,
    body: saved.body,
    createdAt: saved.createdAt
  };
}

async function verifySocketRoomAccess(user, roomId) {
  const room = await findRoomByRoomId(roomId);
  const participant = await assertRoomParticipant(user, room);
  if (!isWithinAccessWindow(room) || room.status === "completed") {
    throw new AppError("Interview room is not active", 403);
  }
  return { room, participantRole: participant.role, isInitiator: participant.role === "company" };
}

module.exports = {
  combineScheduledTime,
  createRoomForRound,
  resolveClientInterviewUrl,
  getRoomDetails,
  joinRoom,
  updateHrNotes,
  setOutcome,
  endInterview,
  appendChatMessage,
  verifySocketRoomAccess,
  serializeRoom,
  findRoomByRoomId
};
