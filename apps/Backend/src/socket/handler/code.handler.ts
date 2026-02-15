import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { getMainDoc } from "../store/crdt.store";

export const registerCodeHandlers = (io: Server, socket: Socket) => {
  socket.on("code-update", ({ roomId, update }) => {
    const doc = getMainDoc(roomId);

    Y.applyUpdate(doc, new Uint8Array(update));

    socket.to(roomId).emit("code-update", update);
  });

  socket.on("request-initial-state", (roomId: string) => {
    const doc = getMainDoc(roomId);
    const state = Y.encodeStateAsUpdate(doc);

    socket.emit("initial-state", state);
  });
};
