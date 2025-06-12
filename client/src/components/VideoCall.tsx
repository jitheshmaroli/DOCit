import React, { useRef, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector } from '../redux/hooks';
import { useSocket } from '../hooks/useSocket';
import { VideoCallProps } from '../types/messageTypes';
import SimplePeer from 'simple-peer';
import { SignalData } from 'simple-peer';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const VideoCall: React.FC<VideoCallProps> = ({
  appointment,
  isInitiator,
  onClose,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState<
    'incoming' | 'ongoing' | 'ended' | null
  >(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasInitiatedRef = useRef(false);

  const { emit } = useSocket(user?._id, {
    onVideoCallSignal: (data: {
      signal: SignalData;
      from: string;
      appointmentId: string;
    }) => {
      if (
        data.from ===
          (isInitiator
            ? appointment.patientId._id
            : appointment.doctorId?._id) &&
        data.appointmentId === appointment._id &&
        peerRef.current
      ) {
        console.log('Received signal:', data.signal);
        peerRef.current.signal(data.signal);
      }
    },
    onIncomingCall: ({ caller, roomId: receivedRoomId, appointmentId }) => {
      if (
        appointmentId === appointment._id &&
        caller ===
          (isInitiator ? appointment.patientId._id : appointment.doctorId?._id)
      ) {
        setCallStatus('incoming');
        setRoomId(receivedRoomId);
        toast.info(
          `Incoming video call from ${isInitiator ? appointment.patientId.name : appointment.doctorId?.name}`
        );
      }
    },
    onCallAccepted: ({ receiver, roomId: receivedRoomId, appointmentId }) => {
      if (
        appointmentId === appointment._id &&
        receiver ===
          (isInitiator ? appointment.patientId._id : appointment.doctorId?._id)
      ) {
        setCallStatus('ongoing');
        setRoomId(receivedRoomId);
        initiatePeerConnection(true);
      }
    },
    onCallEnded: () => {
      handleEndVideoCall();
    },
  });

  const isWithinAppointmentTime = useCallback(() => {
    const now = new Date();
    const startTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.startTime}`
    );
    const endTime = new Date(
      `${appointment.date.split('T')[0]}T${appointment.endTime}`
    );
    return (
      now >= startTime && now <= endTime && appointment.status === 'pending'
    );
  }, [appointment]);

  const handleEndVideoCall = useCallback(async () => {
    try {
      const accessToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('accessToken='))
        ?.split('=')[1];

      await fetch(`${API_URL}/api/video-calls/${appointment._id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        credentials: 'include',
      });

      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (roomId) {
        emit('endCall', { roomId });
      }
      setIsVideoCallActive(false);
      setCallStatus(null);
      setRoomId(null);
      toast.success('Video call ended');
      onClose();
    } catch (error) {
      console.error('End video call error:', error);
      toast.error('Failed to end video call');
    }
  }, [appointment._id, roomId, emit, onClose]);

  const initiatePeerConnection = useCallback(
    async (initiator: boolean) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        console.log('Local stream tracks:', stream.getTracks());

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch((err) => {
            console.error('Local video play error:', err);
            toast.error('Failed to play local video');
          });
        }

        const peer = new SimplePeer({
          initiator,
          stream,
          trickle: true,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ],
          },
        });

        peer.on('signal', (data: SignalData) => {
          if (!roomId) return;
          console.log('Emitting signal:', data);
          if (data.type === 'offer') {
            emit('offer', { offer: data, roomId });
          } else if (data.type === 'answer') {
            emit('answer', { answer: data, roomId });
          } else if (data.type === 'candidate' && 'candidate' in data) {
            emit('iceCandidate', { candidate: data, roomId });
          }
        });

        peer.on('stream', (remoteStream) => {
          console.log(
            'Received remote stream tracks:',
            remoteStream.getTracks()
          );
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch((err) => {
              console.error('Remote video play error:', err);
              toast.error('Failed to play remote video');
            });
          }
        });

        peer.on('connect', () => {
          console.log('WebRTC peer connection established');
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          toast.error('Video call error');
          handleEndVideoCall();
        });

        peerRef.current = peer;
        setIsVideoCallActive(true);
      } catch (err) {
        console.error('Error accessing media devices:', err);
        toast.error('Failed to access camera/microphone');
        handleEndVideoCall();
      }
    },
    [emit, roomId, handleEndVideoCall]
  );

  const handleStartVideoCall = useCallback(async () => {
    if (!isWithinAppointmentTime()) {
      toast.error('Video calls are only available during the appointment time');
      return;
    }
    if (hasInitiatedRef.current || !user?._id) {
      toast.error('User not authenticated');
      return;
    }

    hasInitiatedRef.current = true;
    setCallStatus('ongoing');

    try {
      const payload = {
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        doctorId: appointment.doctorId?._id || user._id,
      };

      const accessToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('accessToken='))
        ?.split('=')[1];

      const response = await fetch(`${API_URL}/api/video-calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!appointment || !appointment.doctorId || !appointment.patientId) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      emit('startCall', {
        caller: user._id,
        receiver: isInitiator
          ? appointment.patientId._id
          : appointment.doctorId._id,
        appointmentId: appointment._id,
      });
      toast.success('Video call initiated');
    } catch (error) {
      console.error('Initiate video call error:', error);
      toast.error('Failed to initiate video call');
      handleEndVideoCall();
    } finally {
      hasInitiatedRef.current = false;
    }
  }, [
    appointment,
    isInitiator,
    user,
    emit,
    isWithinAppointmentTime,
    handleEndVideoCall,
  ]);

  const handleAcceptCall = useCallback(() => {
    if (!roomId || !user?._id) return;
    setCallStatus('ongoing');
    emit('acceptCall', {
      caller: isInitiator
        ? appointment.patientId._id
        : appointment.doctorId?._id,
      receiver: user._id,
      roomId,
      appointmentId: appointment._id,
    });
    initiatePeerConnection(false);
  }, [emit, roomId, user, isInitiator, appointment, initiatePeerConnection]);

  useEffect(() => {
    if (isInitiator && !isVideoCallActive && !hasInitiatedRef.current) {
      handleStartVideoCall();
    }

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [handleStartVideoCall, isInitiator, isVideoCallActive]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              Video Call with{' '}
              {isInitiator
                ? appointment.patientId.name
                : (appointment.doctorId?.name ?? 'Doctor')}
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  callStatus === 'ongoing'
                    ? 'bg-green-500'
                    : 'bg-yellow-500 animate-pulse'
                }`}
              />
              <span className="text-sm text-white/80">
                {callStatus === 'ongoing' ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          </div>
          <button
            onClick={handleEndVideoCall}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {callStatus === 'incoming' ? (
          <div className="flex items-center justify-center h-64 text-white">
            <div className="text-center">
              <p className="mb-4">
                Incoming video call from{' '}
                {isInitiator
                  ? appointment.patientId.name
                  : appointment.doctorId?.name}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleAcceptCall}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.5-4.5M21 12h-6m6 0l-4.5 4.5M9 6v12"
                    />
                  </svg>
                  Accept Call
                </button>
                <button
                  onClick={handleEndVideoCall}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Decline Call
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-1/2">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg border border-white/20 shadow-lg bg-gray-800"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                You
              </div>
            </div>
            <div className="relative w-full md:w-1/2">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border border-white/20 shadow-lg bg-gray-800"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {isInitiator
                  ? appointment.patientId.name
                  : (appointment.doctorId?.name ?? 'Doctor')}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleEndVideoCall}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};
