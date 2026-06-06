const { isEnabled } = require("../config/feature-flags");
const interviewRoomService = require("../services/interview-room.service");
const { notifyInterviewUpdated } = require("../services/interview-workflow.service");
const { getChatIo } = require("./chat.socket");

function interviewRoomChannel(roomId) {
  return `interview:${roomId}`;
}

function normalizeRoomId(roomId) {
  const normalized = String(roomId || "").trim();
  if (!normalized) {
    throw new Error("roomId is required");
  }
  return normalized;
}

function rememberInterviewRoomAccess(socket, roomId) {
  socket.data.interviewRooms = socket.data.interviewRooms || new Set();
  socket.data.interviewRooms.add(String(roomId));
}

function forgetInterviewRoomAccess(socket, roomId) {
  socket.data.interviewRooms?.delete(String(roomId));
}

function broadcastParticipantLeave(io, socket, roomId) {
  io.to(interviewRoomChannel(roomId)).emit("interview:participant:update", {
    roomId,
    userId: String(socket.user._id),
    joined: false
  });
}

async function notifyInterviewEnded(payload, companyUserId) {
  if (!payload?.application || !payload?.room?.roundId) return;
  const round = (payload.application.interviewRounds || []).id(payload.room.roundId);
  if (!round) return;

  const changeType = payload.room.outcome === "rejected" ? "cancelled" : "completed";
  await notifyInterviewUpdated({
    application: payload.application,
    round,
    companyUserId,
    changeType,
    interviewRoomLink: null
  }).catch(() => undefined);
}

function initInterviewSocket() {
  if (!isEnabled("ENABLE_INTERVIEW_ROOMS")) {
    return;
  }

  const io = getChatIo();
  if (!io) {
    return;
  }

  io.on("connection", (socket) => {
    socket.on("interview:join", async ({ roomId }, callback) => {
      try {
        const normalizedRoomId = normalizeRoomId(roomId);
        const joined = await interviewRoomService.joinRoom(socket.user, normalizedRoomId);

        socket.join(interviewRoomChannel(normalizedRoomId));
        rememberInterviewRoomAccess(socket, normalizedRoomId);

        socket.to(interviewRoomChannel(normalizedRoomId)).emit("interview:participant:update", {
          roomId: normalizedRoomId,
          userId: String(socket.user._id),
          role: joined.participantRole,
          joined: true
        });

        callback?.({
          ok: true,
          room: joined.room,
          participantRole: joined.participantRole,
          isInitiator: joined.isInitiator
        });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to join interview room" });
      }
    });

    socket.on("interview:signal", async ({ roomId, signal }, callback) => {
      try {
        const normalizedRoomId = normalizeRoomId(roomId);
        if (!signal || typeof signal !== "object" || !signal.type) {
          throw new Error("Invalid signaling payload");
        }

        await interviewRoomService.verifySocketRoomAccess(socket.user, normalizedRoomId);
        socket.join(interviewRoomChannel(normalizedRoomId));
        rememberInterviewRoomAccess(socket, normalizedRoomId);

        socket.to(interviewRoomChannel(normalizedRoomId)).emit("interview:signal", {
          roomId: normalizedRoomId,
          fromUserId: String(socket.user._id),
          signal
        });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Signaling failed" });
      }
    });

    socket.on("interview:chat", async ({ roomId, body }, callback) => {
      try {
        const normalizedRoomId = normalizeRoomId(roomId);
        const message = await interviewRoomService.appendChatMessage(socket.user, normalizedRoomId, body);
        io.to(interviewRoomChannel(normalizedRoomId)).emit("interview:chat", {
          roomId: normalizedRoomId,
          message
        });
        callback?.({ ok: true, message });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to send message" });
      }
    });

    socket.on("interview:participant:update", async ({ roomId, muted, cameraOff }, callback) => {
      try {
        const normalizedRoomId = normalizeRoomId(roomId);
        const access = await interviewRoomService.verifySocketRoomAccess(socket.user, normalizedRoomId);
        const payload = {
          roomId: normalizedRoomId,
          userId: String(socket.user._id),
          role: access.participantRole
        };
        if (muted !== undefined) payload.muted = Boolean(muted);
        if (cameraOff !== undefined) payload.cameraOff = Boolean(cameraOff);
        socket.to(interviewRoomChannel(normalizedRoomId)).emit("interview:participant:update", payload);
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to update participant status" });
      }
    });

    socket.on("interview:leave", ({ roomId }) => {
      try {
        const normalizedRoomId = normalizeRoomId(roomId);
        socket.leave(interviewRoomChannel(normalizedRoomId));
        forgetInterviewRoomAccess(socket, normalizedRoomId);
        broadcastParticipantLeave(io, socket, normalizedRoomId);
      } catch {
        // Ignore malformed leave payloads.
      }
    });

    socket.on("interview:end", async ({ roomId }, callback) => {
      try {
        const normalizedRoomId = normalizeRoomId(roomId);
        const payload = await interviewRoomService.endInterview(socket.user, normalizedRoomId);
        await notifyInterviewEnded(payload, socket.user._id);

        io.to(interviewRoomChannel(normalizedRoomId)).emit("interview:end", {
          roomId: normalizedRoomId,
          room: payload.room
        });

        forgetInterviewRoomAccess(socket, normalizedRoomId);
        callback?.({ ok: true, room: payload.room });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to end interview" });
      }
    });

    socket.on("disconnect", () => {
      const rooms = socket.data.interviewRooms;
      if (!rooms || rooms.size === 0) return;
      rooms.forEach((roomId) => {
        broadcastParticipantLeave(io, socket, roomId);
      });
      socket.data.interviewRooms = new Set();
    });
  });
}

module.exports = { initInterviewSocket };
