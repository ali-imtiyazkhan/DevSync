"use client";

import { useState } from "react";
import { useWebRTC } from "../components/video/useWebRTC";
import CollaborativeEditor from "../components/editors/CollaborativeEditor";
import VideoCard from "../components/video/VideoCard";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const { localVideoRef, remoteVideoRef, joinCall, shareScreen } =
    useWebRTC(roomId);

  const handleJoin = async () => {
    if (!roomId) return;
    await joinCall();
    setJoined(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">
      <h1 className="text-3xl mb-6">DevSync v1</h1>

      {!joined ? (
        <div className="flex gap-3">
          <input
            className="p-2 rounded text-black"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
          />
          <button
            onClick={handleJoin}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Join
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={shareScreen}
            className="bg-green-600 px-4 py-2 rounded mb-4"
          >
            Share Screen
          </button>

          <div className="grid grid-cols-2 gap-4">
            <VideoCard
              title="My Camera"
              videoRef={localVideoRef}
              muted
            />
            <VideoCard
              title="Friend Camera"
              videoRef={remoteVideoRef}
            />
          </div>

          <CollaborativeEditor roomId={roomId} />
        </>
      )}
    </div>
  );
}
