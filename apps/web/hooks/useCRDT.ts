"use client";

import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { getSocket } from "../lib/socket";

export const useCRDT = (
  roomId: string,
  token: string,
  onReady: (ytext: Y.Text, ydoc: Y.Doc) => void,
) => {
  const ydocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    const socket = getSocket(token);

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("monaco");

    ydocRef.current = ydoc;

    // Send updates
    ydoc.on("update", (update) => {
      socket.emit("code-update", {
        roomId,
        update,
      });
    });

    // Receive updates
    socket.on("code-update", (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    // Initial state
    socket.emit("request-initial-state", roomId);

    socket.on("initial-state", (state) => {
      Y.applyUpdate(ydoc, new Uint8Array(state));
    });

    onReady(ytext, ydoc);

    return () => {
      socket.off("code-update");
      socket.off("initial-state");
      ydoc.destroy();
    };
  }, [roomId, token, onReady]);
};
