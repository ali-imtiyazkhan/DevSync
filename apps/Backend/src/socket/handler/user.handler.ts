import { Server, Socket } from "socket.io";

const activeUsers: Map<string, Set<string>> = new Map();

export const registerUserHandlers = (io: Server, socket: Socket) => {

  socket.on("track-presence", (roomId: string) => {
    const userId = socket.data.userId;

    if (!activeUsers.has(roomId)) {
      activeUsers.set(roomId, new Set());
    }

    activeUsers.get(roomId)!.add(userId);

    io.to(roomId).emit("active-users", Array.from(activeUsers.get(roomId)!));
  });

  socket.on("get-active-users", (roomId: string) => {
    const users = activeUsers.get(roomId) || new Set();
    socket.emit("active-users", Array.from(users));
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;

    for (const [roomId, users] of activeUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);

        io.to(roomId).emit(
          "active-users",
          Array.from(users)
        );

        if (users.size === 0) {
          activeUsers.delete(roomId);
        }
      }
    }

    console.log("User disconnected:", userId);
  });
};
