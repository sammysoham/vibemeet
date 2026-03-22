"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Camera,
  ChevronDown,
  Crown,
  Flag,
  MessageSquareMore,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Send,
  Upload,
  UserRoundPlus,
  Video,
  VideoOff,
} from "lucide-react";
import { AgeGate } from "@/components/age-gate";
import { api, SOCKET_URL } from "@/lib/api";
import {
  getAuthSession,
  getChatModePreference,
  getInterestPreferences,
  getMatchPreference,
} from "@/lib/auth";
import type {
  AuthSession,
  ChatMessage,
  ChatModePreference,
  MatchMode,
  MatchPeer,
} from "@/types";

const RTC_CONFIGURATION = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const DEFAULT_FREE_VIDEO_CHAT_LIMIT = Number(
  process.env.NEXT_PUBLIC_FREE_VIDEO_CHAT_LIMIT || 3,
);

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRoomModeLabel(mode: MatchMode) {
  return mode === "TEXT_ONLY" ? "Text only" : "Voice + text";
}

function getEntryChatModePreference(): ChatModePreference {
  if (typeof window === "undefined") {
    return "VOICE_TEXT";
  }

  const params = new URLSearchParams(window.location.search);
  const routeMode = params.get("mode");

  if (routeMode === "text") {
    return "TEXT_ONLY";
  }

  if (routeMode === "voice") {
    return "VOICE_TEXT";
  }

  return getChatModePreference();
}

export function ChatScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Checking chat access...");
  const [peer, setPeer] = useState<MatchPeer | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isAiFallback, setIsAiFallback] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasLocalMedia, setHasLocalMedia] = useState(false);
  const [hasRemoteMedia, setHasRemoteMedia] = useState(false);
  const [videoChatsUsed, setVideoChatsUsed] = useState(0);
  const [freeVideoChatLimit, setFreeVideoChatLimit] = useState(
    DEFAULT_FREE_VIDEO_CHAT_LIMIT,
  );
  const [accessNote, setAccessNote] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [preferredChatMode, setPreferredChatMode] =
    useState<ChatModePreference>("VOICE_TEXT");
  const [roomMode, setRoomMode] = useState<MatchMode>("VOICE_TEXT");
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const manualExitRef = useRef(false);
  const manualNextRef = useRef(false);
  const initializedQueueRef = useRef(false);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const roomModeRef = useRef<MatchMode>("VOICE_TEXT");

  function appendMessage(message: ChatMessage) {
    setMessages((currentMessages) => {
      if (
        currentMessages.some(
          (existingMessage) => existingMessage.id === message.id,
        )
      ) {
        return currentMessages;
      }

      return [...currentMessages, message];
    });
  }

  useEffect(() => {
    roomModeRef.current = roomMode;
  }, [roomMode]);

  function scrollToBottom(force = false) {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    if (force || shouldStickToBottomRef.current) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: force ? "auto" : "smooth",
      });
      setShowJumpToLatest(false);
    }
  }

  function handleMessagesScroll() {
    const viewport = scrollViewportRef.current;
    if (!viewport) {
      return;
    }

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    const isNearBottom = distanceFromBottom < 96;
    shouldStickToBottomRef.current = isNearBottom;
    setShowJumpToLatest(!isNearBottom && messages.length > 0);
  }

  function clearLocalStream() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setHasLocalMedia(false);
    setIsMuted(false);
    setIsCameraOff(false);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }

  function resetPeerConnection() {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setHasRemoteMedia(false);

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }

  function attachLocalStream(stream: MediaStream) {
    localStreamRef.current = stream;
    setHasLocalMedia(true);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }

  async function ensureLocalStream(allowVoiceVideo: boolean) {
    if (!allowVoiceVideo || localStreamRef.current) {
      return;
    }

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      attachLocalStream(localStream);
      setError("");
    } catch {
      setError(
        "Camera or microphone access was denied. You can still continue with text chat.",
      );
      setStatus("Camera or microphone access missing.");
    }
  }

  function createPeerConnection(nextRoomId: string) {
    const socket = socketRef.current;

    if (!socket) {
      return null;
    }

    resetPeerConnection();

    const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
    const inboundStream = new MediaStream();
    remoteStreamRef.current = inboundStream;

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => inboundStream.addTrack(track));
      setHasRemoteMedia(true);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = inboundStream;
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc:ice-candidate", {
          roomId: nextRoomId,
          candidate: event.candidate,
        });
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current as MediaStream);
      });
    } else {
      peerConnection.addTransceiver("audio", { direction: "recvonly" });
      peerConnection.addTransceiver("video", { direction: "recvonly" });
    }

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }

  function joinQueue() {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    const requestedMode = getEntryChatModePreference();
    setPreferredChatMode(requestedMode);
    setMessages([]);
    setPeer(null);
    setIsAiFallback(false);
    setRoomMode(requestedMode);
    resetPeerConnection();
    setStatus("Looking for someone new...");

    socket.emit("match:join-queue", {
      preferredGender: getMatchPreference(),
      chatMode: requestedMode,
      interests: getInterestPreferences(),
    });
  }

  useEffect(() => {
    const storedSession = getAuthSession();

    if (!storedSession) {
      router.replace("/");
      return;
    }

    const activeSession = storedSession;
    setSession(activeSession);
    setIsPremium(activeSession.user.isPremium);
    setPreferredChatMode(getEntryChatModePreference());

    let active = true;

    async function setup() {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        auth: {
          token: activeSession.token,
        },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        initializedQueueRef.current = false;
      });

      socket.on("connect_error", () => {
        setError("Realtime connection failed. Check that the backend server is running.");
      });

      socket.on("presence:online-count", ({ count }) => {
        setOnlineCount(count);
      });

      socket.on(
        "subscription:access-status",
        async ({
          isPremium: premiumState,
          videoChatAllowed: nextVideoChatAllowed,
          videoChatsUsed: nextVideoChatsUsed,
          freeVideoChatLimit: nextFreeVideoChatLimit,
        }) => {
          const requestedMode = getEntryChatModePreference();

          setPreferredChatMode(requestedMode);
          setIsPremium(Boolean(premiumState));
          setVideoChatsUsed(Number(nextVideoChatsUsed || 0));
          setFreeVideoChatLimit(
            Number(nextFreeVideoChatLimit || DEFAULT_FREE_VIDEO_CHAT_LIMIT),
          );

          const canUseVoiceVideo =
            requestedMode === "VOICE_TEXT" && Boolean(nextVideoChatAllowed);

          if (canUseVoiceVideo) {
            setAccessNote("");
            if (active) {
              await ensureLocalStream(true);
            }
          } else {
            clearLocalStream();
            if (requestedMode === "TEXT_ONLY") {
              setAccessNote(
                "Text-only mode is active by choice, so the chat panel stays primary.",
              );
            } else if (!nextVideoChatAllowed) {
              setAccessNote(
                "Your free live video limit is used up for today. Text chat still works, and premium unlocks more live video.",
              );
            }
          }

          if (!initializedQueueRef.current && active) {
            initializedQueueRef.current = true;
            joinQueue();
          }
        },
      );

      socket.on("match:queued", ({ message }) => {
        setStatus(message);
      });

      socket.on("match:found", async (payload) => {
        manualNextRef.current = false;
        setMessages([]);
        setPeer(payload.peer);
        setIsAiFallback(false);
        setRoomMode(payload.chatMode || "VOICE_TEXT");
        setStatus(
          `Matched with ${payload.peer.displayName} in ${getRoomModeLabel(
            payload.chatMode || "VOICE_TEXT",
          ).toLowerCase()}.`,
        );

        if ((payload.chatMode || "VOICE_TEXT") === "TEXT_ONLY") {
          resetPeerConnection();
          clearLocalStream();
          return;
        }

        await ensureLocalStream(true);

        const peerConnection = createPeerConnection(payload.roomId);
        if (!peerConnection) {
          return;
        }

        if (payload.shouldCreateOffer) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          socket.emit("webrtc:offer", {
            roomId: payload.roomId,
            offer,
          });
        }
      });

      socket.on("match:ai-fallback", (payload) => {
        manualNextRef.current = false;
        setMessages([]);
        resetPeerConnection();
        clearLocalStream();
        setPeer(payload.peer);
        setIsAiFallback(true);
        setRoomMode(payload.chatMode || "TEXT_ONLY");
        setStatus("No one was free right now, so Nova joined the chat.");
      });

      socket.on("webrtc:offer", async ({ roomId: nextRoomId, offer }) => {
        if (roomModeRef.current === "TEXT_ONLY") {
          return;
        }

        await ensureLocalStream(true);
        const peerConnection = createPeerConnection(nextRoomId);
        if (!peerConnection) {
          return;
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("webrtc:answer", {
          roomId: nextRoomId,
          answer,
        });
      });

      socket.on("webrtc:answer", async ({ answer }) => {
        if (!peerConnectionRef.current) {
          return;
        }

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      });

      socket.on("webrtc:ice-candidate", async ({ candidate }) => {
        if (!peerConnectionRef.current || !candidate) {
          return;
        }

        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("chat:message", appendMessage);
      socket.on("chat:media", appendMessage);

      socket.on("moderation:warning", ({ message }) => {
        setError(message);
      });

      socket.on("error:message", ({ message }) => {
        setError(message);
      });

      socket.on("match:ended", ({ reason }) => {
        resetPeerConnection();
        setPeer(null);
        setStatus(reason || "Chat ended.");

        if (manualExitRef.current) {
          return;
        }

        if (manualNextRef.current) {
          manualNextRef.current = false;
          return;
        }

        window.setTimeout(() => {
          if (socket.connected) {
            joinQueue();
          }
        }, 700);
      });
    }

    setup();

    return () => {
      active = false;
      manualExitRef.current = true;
      socketRef.current?.disconnect();
      resetPeerConnection();
      clearLocalStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }, [messages]);

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.trim() || !socketRef.current) {
      return;
    }

    socketRef.current.emit("chat:text", { message: draft });
    setDraft("");
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const socket = socketRef.current;

    if (!file || !socket) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const upload = await api.uploadChatMedia(file);
      socket.emit("chat:media", upload);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleReport() {
    if (!peer || peer.id === "ai-stranger") {
      return;
    }

    const reason = window.prompt("What happened?");
    if (!reason) {
      return;
    }

    try {
      await api.reportUser({
        reportedUserId: peer.id,
        reason,
      });
      setError("Report submitted. Thanks for helping keep VibeMeet safer.");
    } catch (reportError) {
      setError(
        reportError instanceof Error ? reportError.message : "Report failed.",
      );
    }
  }

  async function handleAddFriend() {
    if (!peer || !isPremium || peer.id === "ai-stranger") {
      return;
    }

    setAddingFriend(true);
    setError("");

    try {
      await api.addFriend(peer.id);
      setError(`${peer.displayName} has been added to your friends list.`);
    } catch (friendError) {
      setError(
        friendError instanceof Error
          ? friendError.message
          : "Could not add friend.",
      );
    } finally {
      setAddingFriend(false);
    }
  }

  function toggleMute() {
    if (!localStreamRef.current) {
      return;
    }

    const nextMuted = !isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  }

  function toggleCamera() {
    if (!localStreamRef.current) {
      return;
    }

    const nextCameraOff = !isCameraOff;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
    setIsCameraOff(nextCameraOff);
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <AgeGate />
      <div className="min-h-screen overflow-hidden bg-[#fff8ef] text-[#2b1f45]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,112,112,0.2),_transparent_24%),radial-gradient(circle_at_85%_20%,_rgba(84,193,255,0.2),_transparent_22%),linear-gradient(180deg,_#fff9f1_0%,_#fff3ea_100%)]" />
        <div className="relative mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="relative flex min-h-screen flex-col overflow-hidden border-b border-[#ecd7ca] lg:border-r lg:border-b-0">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.3),transparent_38%,transparent_62%,rgba(255,214,196,0.25))]" />
            <header className="relative z-10 flex flex-col gap-4 border-b border-[#ecd7ca] bg-white/65 px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#ff6b6b]/70">
                  VibeMeet live
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[#2b1f45]">
                  {status}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[#655a7c]">
                <span className="rounded-full border border-[#ecd8cb] bg-white px-3 py-1">
                  {session.user.displayName}
                </span>
                <span className="rounded-full border border-[#ecd8cb] bg-white px-3 py-1">
                  {onlineCount} online
                </span>
                <span className="rounded-full border border-[#ecd8cb] bg-white px-3 py-1">
                  {getRoomModeLabel(roomMode)}
                </span>
                <span className="rounded-full border border-[#ecd8cb] bg-white px-3 py-1">
                  {isPremium
                    ? "Premium"
                    : `${videoChatsUsed}/${freeVideoChatLimit} live sessions used`}
                </span>
              </div>
            </header>

            <div className="relative z-10 grid flex-1 gap-4 p-4 sm:p-6 xl:grid-cols-2">
              <div className="video-surface">
                <div className="video-topline">
                  <span className="video-chip">
                    {roomMode === "TEXT_ONLY" ? (
                      <MessageSquareMore className="h-4 w-4" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    You
                  </span>
                  <span className="video-chip border-[#ead6c9] bg-white/75 text-[#6a5f84]">
                    Preference: {preferredChatMode === "TEXT_ONLY" ? "Text only" : "Voice + text"}
                  </span>
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="video-element scale-x-[-1]"
                />
                {!hasLocalMedia ? (
                  <div className="video-fallback">
                    <div className="mb-5 rounded-full border border-[#ead6ca] bg-white px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[#6b617f]">
                      {roomMode === "TEXT_ONLY" ? "Quiet mode" : "Preview"}
                    </div>
                    <p className="text-center text-sm leading-6 text-[#685d81]">
                      {roomMode === "TEXT_ONLY"
                        ? "This match is running as text-only, so the chat panel is the main stage."
                        : "Camera preview unavailable."}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="video-surface">
                <div className="video-topline">
                  <span className="video-chip">
                    {roomMode === "TEXT_ONLY" ? (
                      <MessageSquareMore className="h-4 w-4" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    {peer?.displayName || "Searching..."}
                  </span>
                  {isAiFallback ? (
                    <span className="video-chip border-[#ffcbb1] bg-[#fff1e6] text-[#ff6b6b]">
                      AI fallback
                    </span>
                  ) : null}
                </div>

                {isAiFallback ? (
                  <div className="video-fallback bg-[radial-gradient(circle_at_top,_rgba(255,194,93,0.35),_transparent_35%),linear-gradient(180deg,_rgba(255,250,245,0.95),_rgba(255,239,228,0.98))]">
                    <div className="mb-4 h-24 w-24 rounded-full border border-[#ffc8b1] bg-[#fff2e6] shadow-[0_0_80px_rgba(255,151,92,0.2)]" />
                    <p className="text-2xl font-semibold text-[#2b1f45]">Nova</p>
                    <p className="mt-2 max-w-xs text-center text-sm leading-6 text-[#675c80]">
                      Queue is quiet right now, so Nova is keeping the conversation moving.
                    </p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="video-element"
                    />
                    {!peer || !hasRemoteMedia || roomMode === "TEXT_ONLY" ? (
                      <div className="video-fallback">
                        <div className="mb-4 rounded-full border border-[#ead6ca] bg-white px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[#6b617f]">
                          {roomMode === "TEXT_ONLY" ? "Text-only room" : "Connecting"}
                        </div>
                        <p className="text-center text-sm leading-6 text-[#685d81]">
                          {peer
                            ? roomMode === "TEXT_ONLY"
                              ? "Both sides can keep chatting in the panel without live voice/video."
                              : "Waiting for live media to lock in..."
                            : "Waiting for the next person to connect..."}
                        </p>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3 border-t border-[#ecd7ca] bg-white/60 px-4 py-4 backdrop-blur-md sm:px-6">
              <button
                type="button"
                onClick={() => {
                  manualNextRef.current = true;
                  socketRef.current?.emit("match:next-user", {
                    preferredGender: getMatchPreference(),
                    chatMode: getEntryChatModePreference(),
                    interests: getInterestPreferences(),
                  });
                  setStatus("Skipping...");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff6b6b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f05a5a]"
              >
                <RefreshCw className="h-4 w-4" />
                Next user
              </button>

              <button
                type="button"
                onClick={toggleMute}
                disabled={roomMode === "TEXT_ONLY" || !hasLocalMedia}
                className="control-button disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                disabled={roomMode === "TEXT_ONLY" || !hasLocalMedia}
                className="control-button disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isCameraOff ? (
                  <VideoOff className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                {isCameraOff ? "Camera off" : "Camera on"}
              </button>

              <button type="button" onClick={handleReport} className="control-button">
                <Flag className="h-4 w-4" />
                Report user
              </button>

              {isPremium ? (
                <button
                  type="button"
                  onClick={handleAddFriend}
                  disabled={!peer || peer.id === "ai-stranger" || addingFriend}
                  className="control-button disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <UserRoundPlus className="h-4 w-4" />
                  {addingFriend ? "Adding..." : "Add friend"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  manualExitRef.current = true;
                  socketRef.current?.emit("call:end");
                  router.push("/dashboard");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#ffc7c7] bg-[#fff1f1] px-5 py-3 text-sm font-medium text-[#d64f5f] transition hover:bg-[#ffe5e8]"
              >
                <PhoneOff className="h-4 w-4" />
                End chat
              </button>

              {!isPremium ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#ecd7ca] bg-white px-4 py-2 text-xs text-[#6b617f]">
                  <Crown className="h-4 w-4" />
                  Unlimited text is free. More live sessions and media are premium.
                </span>
              ) : null}
            </div>
          </section>

          <aside className="relative flex min-h-[42vh] flex-col overflow-hidden bg-[linear-gradient(180deg,#fffefb_0%,#fff3e9_100%)]">
            <div className="border-b border-[#ecd7ca] px-4 py-4 sm:px-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#7c7194]">
                Live chat
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#2b1f45]">
                {peer?.displayName || "Waiting..."}
              </h2>
              <p className="mt-2 text-sm text-[#6c617f]">
                {roomMode === "TEXT_ONLY"
                  ? "This room is text-first."
                  : "Live voice + text is active for this room."}
              </p>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div
                ref={scrollViewportRef}
                onScroll={handleMessagesScroll}
                className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5"
              >
                {messages.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-[#ead6ca] bg-white px-4 py-5 text-sm leading-6 text-[#6c617f]">
                  Messages will appear here during the call. Free accounts keep
                  unlimited text chat, while premium accounts can also share
                  images and videos and add friends.
                  </div>
                ) : null}

                {messages.map((message) => {
                  const isOwnMessage = message.senderId === session.user.id;

                  return (
                    <div
                      key={message.id}
                      className={`rounded-[1.5rem] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] ${
                        isOwnMessage
                          ? "ml-8 bg-[linear-gradient(135deg,#ff8a74,#ffcd73)] text-[#2b1f45]"
                          : "mr-8 border border-[#ead6ca] bg-white text-[#2b1f45]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em]">
                        <span>{isOwnMessage ? "You" : message.senderName}</span>
                        <span
                          className={
                            isOwnMessage ? "text-[#5f4767]" : "text-[#8a7ca0]"
                          }
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>

                      {message.mediaUrl ? (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-black/10">
                          {message.mediaType === "video" ? (
                            <video
                              src={message.mediaUrl}
                              controls
                              className="max-h-72 w-full bg-black object-cover"
                            />
                          ) : (
                            <img
                              src={message.mediaUrl}
                              alt={message.message || "Chat upload"}
                              className="max-h-72 w-full object-cover"
                            />
                          )}
                        </div>
                      ) : null}

                      {message.message ? (
                        <p
                          className={`mt-3 text-sm leading-6 ${
                          isOwnMessage ? "text-[#2b1f45]" : "text-[#574b70]"
                        }`}
                      >
                        {message.message}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(255,244,235,0.96))]" />

              {showJumpToLatest ? (
                <button
                  type="button"
                  onClick={() => {
                    shouldStickToBottomRef.current = true;
                    scrollToBottom(true);
                  }}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-[#ead6ca] bg-white px-4 py-2 text-xs text-[#2b1f45] shadow-[0_16px_40px_rgba(233,145,102,0.18)] backdrop-blur-md"
                >
                  <ChevronDown className="h-4 w-4" />
                  Jump to latest
                </button>
              ) : null}
            </div>

            <div className="border-t border-[#ecd7ca] px-4 py-4 sm:px-5">
              {accessNote ? (
                <div className="mb-3 rounded-2xl border border-[#ffd7ad] bg-[#fff5df] px-4 py-3 text-sm text-[#8c5d22]">
                  {accessNote}
                </div>
              ) : null}

              {error ? (
                <div className="mb-3 rounded-2xl border border-[#edd7ca] bg-white px-4 py-3 text-sm text-[#4f4367]">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={3}
                  placeholder="Say hi..."
                  className="w-full resize-none rounded-[1.6rem] border border-[#ead6ca] bg-white px-4 py-3 text-sm text-[#2b1f45] outline-none placeholder:text-[#9c90ae] focus:border-[#ff8a4c]"
                />

                <div className="flex items-center gap-3">
                  <label
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
                      isPremium
                        ? "border-[#ead6ca] bg-white text-[#2b1f45] hover:bg-[#fff5ef]"
                        : "cursor-not-allowed border-[#ead6ca] bg-[#fff8f4] text-[#a297b3]"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Image / video"}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      disabled={!isPremium || uploading}
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff6b6b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f05a5a]"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
