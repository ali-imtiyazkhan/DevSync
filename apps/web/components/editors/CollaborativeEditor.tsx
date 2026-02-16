"use client";

import { useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { useCRDT } from "./useCRDT";

export default function CollaborativeEditor({
    roomId,
}: {
    roomId: string;
}) {
    const editorRef = useRef<any>(null);
    const bindingRef = useRef<any>(null);

    useCRDT(roomId, async (ytext: Y.Text, ydoc: Y.Doc) => {
        if (!editorRef.current) return;

        const { MonacoBinding } = await import("y-monaco");
        const { Awareness } = await import("y-protocols/awareness");

        const awareness = new Awareness(ydoc);

        bindingRef.current = new MonacoBinding(
            ytext,
            editorRef.current.getModel(),
            new Set([editorRef.current]),
            awareness
        );
    });

    return (
        <div className="h-[400px] mt-6">
            <Editor
                height="100%"
                defaultLanguage="javascript"
                theme="vs-dark"
                defaultValue="// DevSync Collaborative Editor"
                onMount={(editor) => {
                    editorRef.current = editor;
                }}
            />
        </div>
    );
}
