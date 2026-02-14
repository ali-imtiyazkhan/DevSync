"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:5000");

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteScreenRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

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

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    cameraStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });

    peerConnection.current.ontrack = (event) => {
      const [stream] = event.streams;

      if (!stream) return;

      // If video track → camera
      if (event.track.kind === "video" && !remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current!.srcObject = stream;
      } else if (event.track.kind === "video") {
        remoteScreenRef.current!.srcObject = stream;
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { roomId, offer });
  };

  const shareScreen = async () => {
    if (!peerConnection.current) return;

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    if (localScreenRef.current) {
      localScreenRef.current.srcObject = screenStream;
    }

    const [screenTrack] = screenStream.getVideoTracks();
    if (!screenTrack) return;

    peerConnection.current.addTrack(screenTrack, screenStream);

    // renegotiate
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { roomId, offer });

    screenTrack.onended = () => {
      console.log("Screen sharing stopped");
    };
  };



  return (
    <div style={styles.container}>
      <h1 style={styles.title}>DevSync - Phase 3</h1>

      {!joined ? (
        <div style={styles.joinBox}>
          <input
            style={styles.input}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button style={styles.button} onClick={joinRoom}>
            Join Room
          </button>
        </div>
      ) : (
        <>
          <h2 style={styles.roomText}>Room: {roomId}</h2>

          <button style={styles.screenBtn} onClick={shareScreen}>
            Share Screen
          </button>

          <div style={styles.grid}>
            <VideoCard title="My Camera" videoRef={localVideoRef} muted />
            <VideoCard title="Friend Camera" videoRef={remoteVideoRef} />
            <VideoCard title="My Screen" videoRef={localScreenRef} />
            <VideoCard title="Friend Screen" videoRef={remoteScreenRef} />
          </div>
        </>
      )}
    </div>
  );
}

function VideoCard({
  title,
  videoRef,
  muted,
}: {
  title: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  muted?: boolean;
}) {

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={styles.video}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 40,
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "white",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
  },
  joinBox: {
    display: "flex",
    gap: 10,
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "none",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    border: "none",
    color: "white",
    borderRadius: 6,
    cursor: "pointer",
  },
  screenBtn: {
    marginBottom: 20,
    padding: "8px 16px",
    backgroundColor: "#16a34a",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "white",
  },
  roomText: {
    marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 10,
  },
  cardTitle: {
    marginBottom: 8,
  },
  video: {
    width: "100%",
    borderRadius: 8,
  },
};
