export interface PeerInstance {
  peer: RTCPeerConnection;
  addLocalStream: (stream: MediaStream) => void;
  replaceVideoTrack: (newTrack: MediaStreamTrack) => Promise<void>;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: () => Promise<RTCSessionDescriptionInit>;
  setRemote: (desc: RTCSessionDescriptionInit) => Promise<void>;
  addIce: (candidate: RTCIceCandidateInit) => Promise<void>;
}

export const createPeer = (): PeerInstance => {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const addLocalStream = (stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
  };

  const replaceVideoTrack = async (newTrack: MediaStreamTrack) => {
    const sender = peer.getSenders().find((s) => s.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  };

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const createAnswer = async () => {
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  };

  const setRemote = async (desc: RTCSessionDescriptionInit) => {
    await peer.setRemoteDescription(desc);
  };

  const addIce = async (candidate: RTCIceCandidateInit) => {
    await peer.addIceCandidate(candidate);
  };

  return {
    peer,
    addLocalStream,
    replaceVideoTrack,
    createOffer,
    createAnswer,
    setRemote,
    addIce,
  };
};
