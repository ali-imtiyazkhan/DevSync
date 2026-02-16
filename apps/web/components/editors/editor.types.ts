import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

export interface CodeUpdatePayload {
  roomId: string;
  update: Uint8Array;
}

export interface InitialStatePayload {
  roomId: string;
}


export type CRDTReadyCallback = (
  yText: Y.Text,
  yDoc: Y.Doc,
  awareness: Awareness,
) => void;


export interface CollaborativeEditorProps {
  roomId: string;
}

export interface ProposalPayload {
  roomId: string;
  content: string;
  submittedBy: string;
}
