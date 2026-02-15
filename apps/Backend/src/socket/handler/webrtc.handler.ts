import { Server, Socket } from "socket.io";

export const registerWebRTCHandlers = (io: Server, socket: Socket) => {
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", {
      offer,
      sender: socket.data.userId,
    });
  });

  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", {
      answer,
      sender: socket.data.userId,
    });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", {
      candidate,
      sender: socket.data.userId,
    });
  });
};
