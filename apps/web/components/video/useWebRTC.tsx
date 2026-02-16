"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "../../lib/socket";
import { useRouter } from "next/navigation";

interface WebRTCReturn {
    localVideoRef: React.RefObject<HTMLVideoElement | null>;
    remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
    joinCall: () => Promise<void>;
    shareScreen: () => Promise<void>;
}

export const useWebRTC = (roomId: string): WebRTCReturn => {
    const router = useRouter();

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const iceQueue = useRef<RTCIceCandidateInit[]>([]);

    // Safe token access
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

    useEffect(() => {
        if (!token) {
            router.push("/signin");
            return;
        }

        const socket = getSocket(token);

        const handleOffer = async ({ offer }: any) => {
            if (!peerRef.current) return;

            await peerRef.current.setRemoteDescription(offer);

            // Flush ICE queue
            for (const candidate of iceQueue.current) {
                await peerRef.current.addIceCandidate(candidate);
            }
            iceQueue.current = [];

            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);

            socket.emit("answer", { roomId, answer });
        };

        const handleAnswer = async ({ answer }: any) => {
            if (!peerRef.current) return;
            await peerRef.current.setRemoteDescription(answer);
        };

        const handleIce = async ({ candidate }: any) => {
            if (!peerRef.current) return;

            if (peerRef.current.remoteDescription) {
                await peerRef.current.addIceCandidate(candidate);
            } else {
                iceQueue.current.push(candidate);
            }
        };

        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIce);

        return () => {
            socket.off("offer", handleOffer);
            socket.off("answer", handleAnswer);
            socket.off("ice-candidate", handleIce);
        };
    }, [roomId, token, router]);

    const joinCall = async (): Promise<void> => {
        if (!token) return;

        const socket = getSocket(token);

        socket.emit("join-room", roomId);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        cameraStreamRef.current = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        peerRef.current = peer;

        stream.getTracks().forEach((track) => {
            peer.addTrack(track, stream);
        });

        peer.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0] ?? null;
            }
        };

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    roomId,
                    candidate: event.candidate,
                });
            }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("offer", { roomId, offer });
    };

    const shareScreen = async (): Promise<void> => {
        if (!peerRef.current) return;

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];

        if (!screenTrack) return; // FIX: undefined safety

        const sender = peerRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");

        if (sender) {
            await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = async () => {
            const cameraTrack =
                cameraStreamRef.current?.getVideoTracks()[0];

            if (sender && cameraTrack) {
                await sender.replaceTrack(cameraTrack);
            }
        };
    };

    return {
        localVideoRef,
        remoteVideoRef,
        joinCall,
        shareScreen,
    };
};
