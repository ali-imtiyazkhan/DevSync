"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000");

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socket.on("offer", async ({ offer }) => {
      if (!peerConnection.current) return;

      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);

      socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(answer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.addIceCandidate(candidate);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const joinRoom = async () => {
    if (!roomId) return;

    socket.emit("join-room", roomId);
    setJoined(true);

    // Get local camera stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Create peer connection
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add tracks
    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      const [remoteStream] = event.streams;

      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };


    // ICE handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    // Create offer
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { roomId, offer });
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>DevSync - Phase 2</h1>

      {!joined ? (
        <>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button onClick={joinRoom}>Join Room</button>
        </>
      ) : (
        <>
          <h2>Room: {roomId}</h2>

          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <h3>Local</h3>
              <video ref={localVideoRef} autoPlay playsInline muted width={300} />
            </div>

            <div>
              <h3>Remote</h3>
              <video ref={remoteVideoRef} autoPlay playsInline width={300} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
