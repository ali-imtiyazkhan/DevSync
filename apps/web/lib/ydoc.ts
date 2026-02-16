import * as Y from "yjs";

export const createYDoc = () => {
  const doc = new Y.Doc();
  const text = doc.getText("monaco");

  return { doc, text };
};
