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
import { CallEndData, HandRaiseData, SignalData, VideoCallModalProps } from '../types/videoCallTypes';

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
    stream?.getTracks().forEach((track) => track.stop());
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
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();

    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);

    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const detect = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setIsSpeaking(average > 10);
      requestAnimationFrame(detect);
    };

    detect();
  };

  // Initial media & peer setup
  useEffect(() => {
    if (!isOpen) return;

    let peerInstance: Peer.Instance | null = null;

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

        peerInstance = new Peer({
          initiator: isCaller,
          trickle: false,
          stream: mediaStream,
        });

        peerInstance.on('signal', (signal: Peer.SignalData) => {
          emit('signal', {
            appointmentId,
            receiverId,
            signal,
          });
        });

        peerInstance.on('stream', (remoteStream: MediaStream) => {
          if (remoteVideoRef.current)
            remoteVideoRef.current.srcObject = remoteStream;
          setIsConnecting(false);
        });

        peerInstance.on('error', (err: Error) => {
          console.error('Peer error:', err);
          toast.error('Video call connection error');
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
      stream?.getTracks().forEach((track) => track.stop());
      peerInstance?.destroy();
      audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCaller, appointmentId, receiverId, emit]);

  // Socket handlers
  useEffect(() => {
    if (!socket || !isOpen) return;

    registerHandlers({
      onSignal: (data: SignalData) => {
        if (data.appointmentId === appointmentId && peer) {
          peer.signal(data.signal as Peer.SignalData);
        }
      },
      onCallEnded: (data: CallEndData) => {
        if (data.appointmentId === appointmentId) {
          toast.info('Call has ended');
          handleClose();
        }
      },
      onHandRaise: (data: HandRaiseData) => {
        if (data.appointmentId === appointmentId) {
          if (data.userId === userId) {
            setIsHandRaised(data.isRaised);
          } else {
            setIsRemoteHandRaised(data.isRaised);
          }
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
    if (callerInfo) {
      emit('acceptCall', { appointmentId, callerId: callerInfo.callerId });
    }
  };

  const handleRejectCall = () => {
    if (callerInfo) {
      emit('rejectCall', { appointmentId, callerId: callerInfo.callerId });
      handleClose();
    }
  };

  const toggleMute = () => {
    stream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  };

  const toggleVideo = () => {
    stream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff((prev) => !prev);
  };

  const toggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    emit('handRaise', { appointmentId, receiverId, isRaised: nextState });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ aspectRatio: '16/10', maxHeight: '85vh' }}
      >
        {/* Remote Video */}
        <div className="absolute inset-0 bg-gray-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 gap-4">
              <Loader2 size={32} className="animate-spin text-primary-400" />
              <p className="text-white text-sm font-medium">Connecting...</p>
            </div>
          )}

          {isRemoteHandRaised && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
              <Hand size={14} /> Hand Raised
            </div>
          )}
        </div>

        {/* Local Video (PiP) */}
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
          {isSpeaking && !isMuted && (
            <div className="absolute inset-0 border-2 border-emerald-400 rounded-xl pointer-events-none animate-pulse" />
          )}
        </div>

        {/* Incoming Call Overlay */}
        {!isCaller && callerInfo && !peer && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <PhoneIncoming size={28} className="text-primary-500" />
              </div>
              <h2 className="font-bold text-xl mb-1">Incoming Call</h2>
              <p className="text-sm text-text-secondary mb-6">
                {callerInfo.callerRole.charAt(0).toUpperCase() +
                  callerInfo.callerRole.slice(1)}{' '}
                is calling...
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectCall}
                  className="flex-1 btn-danger py-3 rounded-xl"
                >
                  <PhoneOff size={18} className="inline mr-2" /> Decline
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >
                  <Phone size={18} /> Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-t from-black/70 to-transparent">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-red-600 text-white'
                : isSpeaking
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition-all ${
              isVideoOff
                ? 'bg-red-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button
            onClick={toggleHand}
            className={`p-3.5 rounded-full transition-all ${
              isHandRaised
                ? 'bg-amber-500 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            <Hand size={20} />
          </button>

          <button
            onClick={handleClose}
            className="p-3.5 rounded-full bg-red-600 text-white hover:bg-red-700 ml-2"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
