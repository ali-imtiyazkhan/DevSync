import { Server } from "socket.io";
import { registerRoomHandlers } from "./handler/room.handler";
import { registerWebRTCHandlers } from "./handler/webrtc.handler";
import { registerUserHandlers } from "./handler/user.handler";

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    registerRoomHandlers(io, socket);
    registerWebRTCHandlers(io, socket);
    registerUserHandlers(io, socket);
  });

  return io;
};
