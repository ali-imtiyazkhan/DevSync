import * as Y from "yjs";

const mainDocs = new Map<string, Y.Doc>();

export const getMainDoc = (roomId: string) => {
  if (!mainDocs.has(roomId)) {
    const doc = new Y.Doc();
    mainDocs.set(roomId, doc);
  }

  return mainDocs.get(roomId)!;
};
