import { Server, Socket } from "socket.io";
import { prisma } from "@devsync/db";

export const registerRoomHandlers = (io: Server, socket: Socket) => {
  socket.on("join-room", async (roomId: string) => {
    const userId = socket.data.userId;

    const membership = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: { userId, roomId },
      },
    });

    if (!membership) {
      return socket.emit("error", "Not a participant");
    }

    socket.join(roomId);

    socket.to(roomId).emit("user-joined", { userId });
  });

  socket.on("leave-room", (roomId: string) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", {
      userId: socket.data.userId,
    });
  });
};
