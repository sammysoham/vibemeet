export function relaySignal(io, socket, eventName, payload) {
  const roomId = payload?.roomId;

  if (!roomId) {
    return;
  }

  socket.to(roomId).emit(eventName, payload);
}
