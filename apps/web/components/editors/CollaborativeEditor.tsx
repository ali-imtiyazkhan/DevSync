"use client";

import { useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { useCRDT } from "../../hooks/useCRDT";

interface Props {
    roomId: string;
    token: string;
}

export default function CollaborativeEditor({ roomId, token }: Props) {
    const editorRef = useRef<any>(null);
    const bindingRef = useRef<any>(null);

    useCRDT(roomId, token, async (ytext: Y.Text, ydoc: Y.Doc) => {
        if (!editorRef.current) return;

        // Dynamically import y-monaco (fixes window undefined error)
        const { MonacoBinding } = await import("y-monaco");

        // Clean previous binding if re-rendered
        if (bindingRef.current) {
            bindingRef.current.destroy?.();
        }

        bindingRef.current = new MonacoBinding(
            ytext,
            editorRef.current.getModel(),
            new Set([editorRef.current]),
            ydoc
        );
    });

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                defaultValue="// DevSync CRDT Editor"
                onMount={(editor) => {
                    editorRef.current = editor;
                }}
            />
        </div>
    );
}
