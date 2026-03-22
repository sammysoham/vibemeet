import { prisma } from "../utils/prisma.js";
import { generateAiReply, getAiOpener } from "../ai/openRouter.js";
import { getModerationFlags, normalizeText } from "../utils/moderation.js";

const waitingQueue = [];
const activeRooms = new Map();
const socketToRoom = new Map();
const aiSessions = new Map();

const AI_FALLBACK_DELAY_MS = 3500;
const FREE_VIDEO_CHAT_LIMIT = Number(process.env.FREE_VIDEO_CHAT_LIMIT || 3);
const AI_NAME = "Nova";

function normalizeInterests(rawInterests) {
  const values = Array.isArray(rawInterests)
    ? rawInterests
    : String(rawInterests || "").split(",");

  return [...new Set(
    values
      .map((interest) => String(interest).trim().toLowerCase())
      .filter(Boolean)
      .map((interest) => interest.slice(0, 32)),
  )].slice(0, 8);
}

function getRequestedChatMode(preferences) {
  const mode = String(preferences?.chatMode || "VOICE_TEXT").toUpperCase();
  return mode === "TEXT_ONLY" ? "TEXT_ONLY" : "VOICE_TEXT";
}

function resolveRoomChatMode(firstEntry, secondEntry) {
  const firstMode = getRequestedChatMode(firstEntry.preferences);
  const secondMode = getRequestedChatMode(secondEntry.preferences);

  if (
    firstMode === "TEXT_ONLY" ||
    secondMode === "TEXT_ONLY" ||
    !firstEntry.videoChatAllowed ||
    !secondEntry.videoChatAllowed
  ) {
    return "TEXT_ONLY";
  }

  return "VOICE_TEXT";
}

function buildPeerProfile(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    gender: user.gender,
    isPremium: user.isPremium,
  };
}

function buildChatPayload({
  roomId,
  sender,
  senderId,
  senderName,
  message,
  mediaUrl,
  mediaType,
  isAi = false,
}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId,
    sender,
    senderId,
    senderName,
    message,
    mediaUrl,
    mediaType,
    isAi,
    createdAt: new Date().toISOString(),
  };
}

function getStartOfDay() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function getTodayVideoChatCount(userId) {
  return prisma.match.count({
    where: {
      isAiFallback: false,
      chatMode: "VOICE_TEXT",
      startedAt: { gte: getStartOfDay() },
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });
}

async function emitAccessStatus(socket) {
  const videoChatsUsed = await getTodayVideoChatCount(socket.data.user.id);
  const videoChatAllowed =
    socket.data.user.isPremium || videoChatsUsed < FREE_VIDEO_CHAT_LIMIT;

  socket.emit("subscription:access-status", {
    isPremium: socket.data.user.isPremium,
    remainingSkips: null,
    videoChatsUsed,
    freeVideoChatLimit: FREE_VIDEO_CHAT_LIMIT,
    videoChatAllowed,
  });
}

function clearQueueEntry(socketId) {
  const index = waitingQueue.findIndex((entry) => entry.socket.id === socketId);

  if (index === -1) {
    return null;
  }

  const [entry] = waitingQueue.splice(index, 1);
  clearTimeout(entry.timeoutId);
  return entry;
}

function getEffectivePreference(user, preferences) {
  if (!user.isPremium) {
    return "ANY";
  }

  return String(preferences?.preferredGender || "ANY").toUpperCase();
}

function isCompatible(entry, candidate) {
  const ownPreference = getEffectivePreference(entry.user, entry.preferences);
  const candidatePreference = getEffectivePreference(candidate.user, candidate.preferences);

  const matchesOwnPreference =
    ownPreference === "ANY" || ownPreference === candidate.user.gender;
  const matchesCandidatePreference =
    candidatePreference === "ANY" || candidatePreference === entry.user.gender;

  return matchesOwnPreference && matchesCandidatePreference;
}

function getInterestOverlapScore(entry, candidate) {
  const entryInterests = normalizeInterests(entry.preferences?.interests);
  const candidateInterests = normalizeInterests(candidate.preferences?.interests);

  if (entryInterests.length === 0 || candidateInterests.length === 0) {
    return 0;
  }

  const candidateSet = new Set(candidateInterests);

  return entryInterests.reduce((score, interest) => {
    return score + (candidateSet.has(interest) ? 1 : 0);
  }, 0);
}

function findBestCompatibleEntry(currentEntry) {
  let bestCandidate = null;
  let bestScore = -1;

  for (const candidate of waitingQueue) {
    if (candidate.socket.id === currentEntry.socket.id) {
      continue;
    }

    if (!isCompatible(currentEntry, candidate)) {
      continue;
    }

    const score = getInterestOverlapScore(currentEntry, candidate);

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

async function createHumanMatch(io, firstEntry, secondEntry) {
  clearQueueEntry(firstEntry.socket.id);
  clearQueueEntry(secondEntry.socket.id);

  const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const chatMode = resolveRoomChatMode(firstEntry, secondEntry);

  await firstEntry.socket.join(roomId);
  await secondEntry.socket.join(roomId);

  activeRooms.set(roomId, {
    roomId,
    socketIds: [firstEntry.socket.id, secondEntry.socket.id],
    userIds: [firstEntry.user.id, secondEntry.user.id],
    chatMode,
    isAiFallback: false,
  });

  socketToRoom.set(firstEntry.socket.id, roomId);
  socketToRoom.set(secondEntry.socket.id, roomId);

  prisma.match
    .create({
      data: {
        user1Id: firstEntry.user.id,
        user2Id: secondEntry.user.id,
        chatMode,
        roomId,
      },
    })
    .catch(() => null);

  firstEntry.socket.emit("match:found", {
    roomId,
    peer: buildPeerProfile(secondEntry.user),
    shouldCreateOffer: true,
    chatMode,
    isAiFallback: false,
  });

  secondEntry.socket.emit("match:found", {
    roomId,
    peer: buildPeerProfile(firstEntry.user),
    shouldCreateOffer: false,
    chatMode,
    isAiFallback: false,
  });
}

async function createAiFallback(socket) {
  if (!socket.connected || socketToRoom.has(socket.id)) {
    return;
  }

  clearQueueEntry(socket.id);

  const roomId = `ai-${socket.id}`;

  await socket.join(roomId);
  activeRooms.set(roomId, {
    roomId,
    socketIds: [socket.id],
    userIds: [socket.data.user.id],
    chatMode: "TEXT_ONLY",
    isAiFallback: true,
  });
  socketToRoom.set(socket.id, roomId);

  const opener = getAiOpener();
  aiSessions.set(roomId, [{ role: "assistant", content: opener }]);

  prisma.match
    .create({
      data: {
        user1Id: socket.data.user.id,
        chatMode: "TEXT_ONLY",
        isAiFallback: true,
        roomId,
      },
    })
    .catch(() => null);

  socket.emit("match:ai-fallback", {
    roomId,
    peer: {
      id: "ai-stranger",
      displayName: AI_NAME,
      gender: "UNSPECIFIED",
      isPremium: false,
    },
    chatMode: "TEXT_ONLY",
    isAiFallback: true,
  });

  setTimeout(() => {
    socket.emit(
      "chat:message",
      buildChatPayload({
        roomId,
        sender: "peer",
        senderId: "ai-stranger",
        senderName: AI_NAME,
        message: opener,
        isAi: true,
      }),
    );
  }, 450);

}

async function teardownRoom(io, socket, reason, notifySelf = true) {
  const roomId = socketToRoom.get(socket.id);

  if (!roomId) {
    return;
  }

  const room = activeRooms.get(roomId);
  socketToRoom.delete(socket.id);

  if (!room) {
    return;
  }

  if (room.isAiFallback) {
    activeRooms.delete(roomId);
    aiSessions.delete(roomId);
    await socket.leave(roomId);

    if (notifySelf && socket.connected) {
      socket.emit("match:ended", { reason });
    }

    return;
  }

  const peerSocketId = room.socketIds.find((socketId) => socketId !== socket.id);
  const peerSocket = peerSocketId ? io.sockets.sockets.get(peerSocketId) : null;

  activeRooms.delete(roomId);
  await socket.leave(roomId);

  if (peerSocketId) {
    socketToRoom.delete(peerSocketId);
  }

  if (peerSocket) {
    await peerSocket.leave(roomId);
    peerSocket.emit("match:ended", { reason });
  }

  if (notifySelf && socket.connected) {
    socket.emit("match:ended", { reason });
  }
}

export function broadcastPresence(io) {
  io.emit("presence:online-count", { count: io.of("/").sockets.size });
}

export async function initializeSocketState(socket) {
  await emitAccessStatus(socket);
}

export async function enqueueForMatch(io, socket, preferences = {}) {
  clearQueueEntry(socket.id);
  await emitAccessStatus(socket);

  const currentRoomId = socketToRoom.get(socket.id);
  if (currentRoomId) {
    await teardownRoom(io, socket, "Switched matchmaking queues.");
  }

  const currentEntry = {
    socket,
    user: socket.data.user,
    preferences: {
      ...preferences,
      interests: normalizeInterests(preferences?.interests),
    },
    videoChatAllowed:
      socket.data.user.isPremium ||
      (await getTodayVideoChatCount(socket.data.user.id)) < FREE_VIDEO_CHAT_LIMIT,
    timeoutId: null,
  };

  const compatibleEntry = findBestCompatibleEntry(currentEntry);

  if (compatibleEntry) {
    await createHumanMatch(io, compatibleEntry, currentEntry);
    return;
  }

  currentEntry.timeoutId = setTimeout(() => {
    createAiFallback(socket);
  }, AI_FALLBACK_DELAY_MS);

  waitingQueue.push(currentEntry);
  socket.emit("match:queued", {
    message: "Looking for someone new...",
    premiumFilterApplied:
      getEffectivePreference(socket.data.user, preferences) !== "ANY",
  });
}

export async function handleTextMessage(io, socket, rawMessage) {
  const roomId = socketToRoom.get(socket.id);

  if (!roomId) {
    return;
  }

  const message = normalizeText(rawMessage);
  if (!message) {
    return;
  }

  const moderation = getModerationFlags(message);

  if (moderation.blocked) {
    socket.emit("moderation:warning", {
      message:
        "That message was blocked by VibeMeet safety filters. Please keep things respectful.",
    });
    return;
  }

  const room = activeRooms.get(roomId);
  const payload = buildChatPayload({
    roomId,
    sender: "self",
    senderId: socket.data.user.id,
    senderName: socket.data.user.displayName,
    message,
  });

  if (room?.isAiFallback) {
    socket.emit("chat:message", payload);

    const history = aiSessions.get(roomId) || [];
    history.push({ role: "user", content: message });
    const reply = await generateAiReply(history);
    history.push({ role: "assistant", content: reply });
    aiSessions.set(roomId, history);

    setTimeout(() => {
      socket.emit(
        "chat:message",
        buildChatPayload({
          roomId,
          sender: "peer",
          senderId: "ai-stranger",
          senderName: AI_NAME,
          message: reply,
          isAi: true,
        }),
      );
    }, 700);

    return;
  }

  io.to(roomId).emit("chat:message", payload);
}

export async function handleMediaMessage(io, socket, media) {
  if (!socket.data.user.isPremium) {
    socket.emit("error:message", {
      message: "Premium is required to send images and videos.",
    });
    return;
  }

  const roomId = socketToRoom.get(socket.id);
  if (!roomId) {
    return;
  }

  const room = activeRooms.get(roomId);
  const payload = buildChatPayload({
    roomId,
    sender: "self",
    senderId: socket.data.user.id,
    senderName: socket.data.user.displayName,
    mediaUrl: media.url,
    mediaType: media.mediaType,
    message: media.fileName || `${media.mediaType} upload`,
  });

  if (room?.isAiFallback) {
    socket.emit("chat:media", payload);

    setTimeout(() => {
      socket.emit(
        "chat:message",
        buildChatPayload({
          roomId,
          sender: "peer",
          senderId: "ai-stranger",
          senderName: AI_NAME,
          message:
            media.mediaType === "video"
              ? "okay, cinematic. you've got range."
              : "nice pic. you've got good taste.",
          isAi: true,
        }),
      );
    }, 500);

    return;
  }

  io.to(roomId).emit("chat:media", payload);
}

export async function handleNextUser(io, socket, preferences = {}) {
  await teardownRoom(io, socket, "Skipped to the next chat.");
  await enqueueForMatch(io, socket, preferences);
}

export async function handleEndChat(io, socket) {
  clearQueueEntry(socket.id);
  await teardownRoom(io, socket, "Chat ended.");
}

export async function handleDisconnect(io, socket) {
  clearQueueEntry(socket.id);
  await teardownRoom(io, socket, "Your match disconnected.", false);
}
