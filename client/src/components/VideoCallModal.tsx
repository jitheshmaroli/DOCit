/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { toast } from 'react-toastify';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Hand,
  PhoneOff,
  Phone,
  PhoneIncoming,
  Loader2,
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  userId: string;
  receiverId: string;
  isCaller: boolean;
  callerInfo?: { callerId: string; callerRole: string } | null;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  userId,
  receiverId,
  isCaller,
  callerInfo,
}) => {
  const { socket, emit, registerHandlers } = useSocket();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRemoteHandRaised, setIsRemoteHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const handleClose = () => {
    stream?.getTracks().forEach((t) => t.stop());
    peer?.destroy();
    audioContextRef.current?.close();
    emit('endCall', { appointmentId, receiverId });
    setStream(null);
    setPeer(null);
    setIsSpeaking(false);
    setIsHandRaised(false);
    setIsRemoteHandRaised(false);
    setIsConnecting(true);
    onClose();
  };

  const setupAudioAnalyser = (mediaStream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const mic = audioContext.createMediaStreamSource(mediaStream);
    analyser.fftSize = 256;
    mic.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const detect = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      setIsSpeaking(
        dataArray.reduce((s, v) => s + v, 0) / dataArray.length > 10
      );
      requestAnimationFrame(detect);
    };
    detect();
  };

  useEffect(() => {
    if (!isOpen) return;
    const setupMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (localVideoRef.current)
          localVideoRef.current.srcObject = mediaStream;
        setupAudioAnalyser(mediaStream);
        const peerInstance = new Peer({
          initiator: isCaller,
          trickle: false,
          stream: mediaStream,
        });
        peerInstance.on('signal', (signal) =>
          emit('signal', {
            appointmentId,
            receiverId,
            signal,
            senderId: userId,
          })
        );
        peerInstance.on('stream', (remoteStream) => {
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = remoteStream;
          setIsConnecting(false);
        });
        peerInstance.on('error', (err) => {
          console.error('Peer error:', err);
          toast.error('Video call error');
          handleClose();
        });
        setPeer(peerInstance);
      } catch (error) {
        console.error('Media setup error:', error);
        toast.error('Failed to access camera or microphone');
        handleClose();
      }
    };
    setupMedia();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      peer?.destroy();
      audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCaller, appointmentId, receiverId, userId, emit]);

  useEffect(() => {
    if (!socket || !isOpen) return;
    registerHandlers({
      onSignal: (data: {
        appointmentId: string;
        senderId: string;
        signal: any;
      }) => {
        if (data.appointmentId === appointmentId && peer)
          peer.signal(data.signal);
      },
      onCallEnded: (data: { appointmentId: string; enderId: string }) => {
        if (data.appointmentId === appointmentId) {
          toast.info('Call ended');
          handleClose();
        }
      },
      onHandRaise: (data: {
        appointmentId: string;
        userId: string;
        isRaised: boolean;
      }) => {
        if (data.appointmentId === appointmentId) {
          if (data.userId === userId) setIsHandRaised(data.isRaised);
          else setIsRemoteHandRaised(data.isRaised);
        }
      },
    });
    return () => {
      socket.off('signal');
      socket.off('callEnded');
      socket.off('handRaise');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, peer, appointmentId, isOpen, userId]);

  const handleAcceptCall = () => {
    if (callerInfo)
      emit('acceptCall', {
        appointmentId,
        callerId: callerInfo.callerId,
        userId,
      });
  };
  const handleRejectCall = () => {
    if (callerInfo) {
      emit('rejectCall', {
        appointmentId,
        callerId: callerInfo.callerId,
        userId,
      });
      handleClose();
    }
  };
  const toggleMute = () => {
    stream?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((p) => !p);
  };
  const toggleVideo = () => {
    stream?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsVideoOff((p) => !p);
  };
  const toggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    emit('handRaise', { appointmentId, receiverId, isRaised: next });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '16/10', maxHeight: '85vh' }}
      >
        {/* ── Remote video (main) ── */}
        <div className="absolute inset-0 bg-gray-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Connecting overlay */}
          {isConnecting && !(!isCaller && callerInfo && !peer) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 gap-4">
              <Loader2 size={32} className="animate-spin text-primary-400" />
              <p className="text-white text-sm font-medium">Connecting...</p>
            </div>
          )}

          {/* Remote hand raised */}
          {isRemoteHandRaised && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg animate-fade-in">
              <Hand size={14} /> Hand Raised
            </div>
          )}
        </div>

        {/* ── Local video (PiP) ── */}
        <div className="absolute bottom-20 right-4 w-36 h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isHandRaised && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <Hand size={10} /> Raised
            </div>
          )}
          {/* Speaking indicator */}
          {isSpeaking && !isMuted && (
            <div className="absolute inset-0 border-2 border-emerald-400 rounded-xl pointer-events-none animate-pulse" />
          )}
        </div>

        {/* ── Incoming call prompt ── */}
        {!isCaller && callerInfo && !peer && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <PhoneIncoming size={28} className="text-primary-500" />
              </div>
              <h2 className="font-display font-bold text-text-primary text-xl mb-1">
                Incoming Call
              </h2>
              <p className="text-sm text-text-secondary mb-6">
                {callerInfo.callerRole.charAt(0).toUpperCase() +
                  callerInfo.callerRole.slice(1)}{' '}
                is calling...
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRejectCall}
                  className="flex-1 btn-danger justify-center py-3 rounded-xl"
                >
                  <PhoneOff size={18} /> Decline
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                >
                  <Phone size={18} /> Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Control bar ── */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-t from-black/70 to-transparent">
          {/* Mute */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isMuted
                ? 'bg-error text-white hover:bg-red-700'
                : isSpeaking
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isVideoOff
                ? 'bg-error text-white hover:bg-red-700'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          {/* Raise hand */}
          <button
            onClick={toggleHand}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
            className={`p-3.5 rounded-full transition-all duration-200 ${
              isHandRaised
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Hand size={20} />
          </button>

          {/* End call */}
          <button
            onClick={handleClose}
            title="End call"
            className="p-3.5 rounded-full bg-error text-white hover:bg-red-700 transition-colors shadow-lg ml-2"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
