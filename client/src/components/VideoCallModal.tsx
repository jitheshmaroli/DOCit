/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { toast } from 'react-toastify';
import { useSocket } from '../context/SocketContext';
import { Video, Mic, MicOff, VideoOff, Hand } from 'lucide-react';

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
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    emit('endCall', { appointmentId, receiverId });
    setStream(null);
    setPeer(null);
    setIsSpeaking(false);
    setIsHandRaised(false);
    setIsRemoteHandRaised(false);
    onClose();
  };

  const setupAudioAnalyser = (mediaStream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(mediaStream);
    analyser.fftSize = 256;
    microphone.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    microphoneRef.current = microphone;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const detectSpeech = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setIsSpeaking(average > 10); // Adjust threshold as needed
      requestAnimationFrame(detectSpeech);
    };
    detectSpeech();
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
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        setupAudioAnalyser(mediaStream);

        const peerInstance = new Peer({
          initiator: isCaller,
          trickle: false,
          stream: mediaStream,
        });

        peerInstance.on('signal', (signal) => {
          emit('signal', {
            appointmentId,
            receiverId,
            signal,
            senderId: userId,
          });
        });

        peerInstance.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
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
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isOpen, isCaller, appointmentId, receiverId, userId, emit]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    registerHandlers({
      onSignal: (data: {
        appointmentId: string;
        senderId: string;
        signal: any;
      }) => {
        if (data.appointmentId === appointmentId && peer) {
          peer.signal(data.signal);
        }
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
  }, [socket, peer, appointmentId, handleClose, isOpen, userId]);

  const handleAcceptCall = () => {
    if (callerInfo) {
      emit('acceptCall', {
        appointmentId,
        callerId: callerInfo.callerId,
        userId,
      });
    }
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
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleHandRaise = () => {
    const newHandRaisedState = !isHandRaised;
    setIsHandRaised(newHandRaisedState);
    emit('handRaise', {
      appointmentId,
      receiverId,
      isRaised: newHandRaisedState,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-lg p-4">
        {/* Remote Video (Main Screen) */}
        <div className="relative w-full h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover rounded-lg"
          />
          {isRemoteHandRaised && (
            <div className="absolute top-4 left-4 bg-yellow-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <Hand className="w-5 h-5" />
              <span>Hand Raised</span>
            </div>
          )}
        </div>

        {/* Local Video (Small Square) */}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-black/50 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isHandRaised && (
            <div className="absolute top-2 left-2 bg-yellow-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-sm">
              <Hand className="w-4 h-4" />
              <span>Hand Raised</span>
            </div>
          )}
        </div>

        {/* Incoming Call Prompt */}
        {!isCaller && callerInfo && !peer && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-lg text-center">
              <h2 className="text-xl text-white mb-4">
                Incoming call from {callerInfo.callerRole}
              </h2>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleAcceptCall}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={handleRejectCall}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : isSpeaking ? 'bg-green-600 animate-pulse' : 'bg-gray-600'} text-white hover:bg-opacity-80`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} text-white hover:bg-opacity-80`}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6" />
            ) : (
              <Video className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-full ${isHandRaised ? 'bg-yellow-600' : 'bg-gray-600'} text-white hover:bg-opacity-80`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand className="w-6 h-6" />
          </button>
          <button
            onClick={handleClose}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
            title="End call"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
