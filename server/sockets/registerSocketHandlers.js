import { prisma } from "../utils/prisma.js";
import { verifyToken } from "../utils/jwt.js";
import {
  broadcastPresence,
  enqueueForMatch,
  handleDisconnect,
  handleEndChat,
  handleMediaMessage,
  handleNextUser,
  handleTextMessage,
  initializeSocketState,
} from "../matchmaking/queueManager.js";
import { relaySignal } from "../webrtc/relaySignal.js";

export function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        throw new Error("Unauthorized");
      }

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });

      if (!user) {
        throw new Error("Unauthorized");
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    initializeSocketState(socket);
    broadcastPresence(io);

    socket.on("match:join-queue", async (preferences) => {
      await enqueueForMatch(io, socket, preferences);
    });

    socket.on("chat:text", async ({ message }) => {
      await handleTextMessage(io, socket, message);
    });

    socket.on("chat:media", async (media) => {
      await handleMediaMessage(io, socket, media);
    });

    socket.on("match:next-user", async (preferences) => {
      await handleNextUser(io, socket, preferences);
    });

    socket.on("call:end", async () => {
      await handleEndChat(io, socket);
    });

    socket.on("webrtc:offer", (payload) => {
      relaySignal(io, socket, "webrtc:offer", payload);
    });

    socket.on("webrtc:answer", (payload) => {
      relaySignal(io, socket, "webrtc:answer", payload);
    });

    socket.on("webrtc:ice-candidate", (payload) => {
      relaySignal(io, socket, "webrtc:ice-candidate", payload);
    });

    socket.on("disconnect", async () => {
      await handleDisconnect(io, socket);
      broadcastPresence(io);
    });
  });
}
