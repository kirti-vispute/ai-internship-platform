const { isEnabled } = require("../config/feature-flags");
const interviewRoomService = require("../services/interview-room.service");
const { getChatIo } = require("./chat.socket");

function interviewRoomChannel(roomId) {
  return `interview:${roomId}`;
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
        const access = await interviewRoomService.verifySocketRoomAccess(socket.user, roomId);
        if (access.room.status === "scheduled") {
          access.room.status = "live";
          access.room.startedAt = new Date();
          await access.room.save();
        }

        socket.join(interviewRoomChannel(roomId));

        const payload = {
          room: interviewRoomService.serializeRoom(access.room, access.participantRole),
          participantRole: access.participantRole,
          isInitiator: access.isInitiator
        };

        socket.to(interviewRoomChannel(roomId)).emit("interview:participant:update", {
          roomId,
          userId: String(socket.user._id),
          role: access.participantRole,
          joined: true
        });

        callback?.({ ok: true, ...payload });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to join interview room" });
      }
    });

    socket.on("interview:signal", async ({ roomId, signal }, callback) => {
      try {
        await interviewRoomService.verifySocketRoomAccess(socket.user, roomId);
        socket.to(interviewRoomChannel(roomId)).emit("interview:signal", {
          roomId,
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
        const message = await interviewRoomService.appendChatMessage(socket.user, roomId, body);
        io.to(interviewRoomChannel(roomId)).emit("interview:chat", {
          roomId,
          message
        });
        callback?.({ ok: true, message });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to send message" });
      }
    });

    socket.on("interview:participant:update", async ({ roomId, muted, cameraOff }, callback) => {
      try {
        const access = await interviewRoomService.verifySocketRoomAccess(socket.user, roomId);
        socket.to(interviewRoomChannel(roomId)).emit("interview:participant:update", {
          roomId,
          userId: String(socket.user._id),
          role: access.participantRole,
          muted: Boolean(muted),
          cameraOff: Boolean(cameraOff)
        });
        callback?.({ ok: true });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to update participant status" });
      }
    });

    socket.on("interview:end", async ({ roomId }, callback) => {
      try {
        const payload = await interviewRoomService.endInterview(socket.user, roomId);
        io.to(interviewRoomChannel(roomId)).emit("interview:end", {
          roomId,
          room: payload.room
        });
        callback?.({ ok: true, room: payload.room });
      } catch (error) {
        callback?.({ ok: false, message: error.message || "Failed to end interview" });
      }
    });
  });
}

module.exports = { initInterviewSocket };
