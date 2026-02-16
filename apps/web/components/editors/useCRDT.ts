"use client";

import { useEffect } from "react";
import * as Y from "yjs";
import { getSocket } from "../../lib/socket";

export const useCRDT = (
  roomId: string,
  onReady: (ytext: Y.Text, ydoc: Y.Doc) => void,
) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  useEffect(() => {
    const socket = getSocket(token);

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("monaco");

    onReady(ytext, ydoc);

    ydoc.on("update", (update) => {
      socket.emit("code-update", { roomId, update });
    });

    socket.on("code-update", (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    socket.emit("request-initial-state", roomId);

    socket.on("initial-state", (state) => {
      Y.applyUpdate(ydoc, new Uint8Array(state));
    });

    return () => {
      ydoc.destroy();
    };
  }, [roomId]);
};
