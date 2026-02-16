import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: { token },
    });
  }

  return socket;
};
