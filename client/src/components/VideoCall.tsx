import React, { useRef, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import Peer, { SignalData } from 'simple-peer';
import { AxiosError } from 'axios';
import axios from 'axios';
import { useAppSelector } from '../redux/hooks';
import { useSocket } from '../hooks/useSocket';
import { VideoCallProps, VideoCallSignal } from '../types/messageTypes';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const VideoCall: React.FC<VideoCallProps> = ({
  appointment,
  isInitiator,
  onClose,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasInitiatedRef = useRef(false);
  const isInitiatingRef = useRef(false);

  const { emit } = useSocket(user?._id, {
    onVideoCallSignal: (data: VideoCallSignal) => {
      if (
        data.from ===
          (isInitiator
            ? appointment.patientId._id
            : appointment.doctorId?._id) &&
        data.appointmentId === appointment._id &&
        peerRef.current
      ) {
        peerRef.current.signal(data.signal);
        console.log('Received and processed video call signal');
      }
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

  useEffect(() => {
    if (isVideoCallActive && localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
      console.log('Local stream assigned to video element');
    }
  }, [isVideoCallActive]);

  const handleInitiateVideoCall = useCallback(async () => {
    if (hasInitiatedRef.current || !user?._id || !isWithinAppointmentTime()) {
      if (!isWithinAppointmentTime()) {
        toast.error(
          'Video calls are only available during the appointment time'
        );
      }
      return;
    }

    try {
      hasInitiatedRef.current = true;
      isInitiatingRef.current = true;

      const payload = {
        appointmentId: appointment._id,
        patientId: appointment.patientId._id,
        doctorId: appointment.doctorId?._id || user._id,
      };

      const response = await axios.post(
        `${API_URL}/api/video-calls/initiate`,
        payload,
        {
          withCredentials: true,
        }
      );
      console.log('Video call session:', response.data);

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('Media stream acquired:', streamRef.current);

      setIsVideoCallActive(true);

      peerRef.current = new Peer({
        initiator: isInitiator,
        trickle: false,
        stream: streamRef.current,
      });

      peerRef.current.on('signal', (data: SignalData) => {
        emit('videoCallSignal', {
          appointmentId: appointment._id,
          signal: data,
          to: isInitiator
            ? appointment.patientId._id
            : appointment.doctorId?._id, // 'to' is now valid
          from: user._id, // Add 'from' for consistency
        });
      });

      peerRef.current.on('stream', (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          console.log('Remote stream assigned to video element');
        }
      });

      peerRef.current.on('error', (err) => {
        console.error('Peer error:', err);
        toast.error('Video call error: ' + err.message);
      });

      toast.success('Video call initiated');
    } catch (error: AxiosError | unknown) {
      console.error('Initiate video call error:', error);
      // Use type guard to safely access error properties
      const errorMessage =
        error instanceof AxiosError && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to initiate video call';
      toast.error(errorMessage);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsVideoCallActive(false);
    } finally {
      hasInitiatedRef.current = false;
      isInitiatingRef.current = false;
    }
  }, [user, appointment, isInitiator, isWithinAppointmentTime, emit]);

  const handleEndVideoCall = useCallback(async () => {
    if (isInitiatingRef.current) return;

    try {
      await axios.post(
        `${API_URL}/api/video-calls/${appointment._id}/end`,
        {},
        {
          withCredentials: true,
        }
      );
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsVideoCallActive(false);
      toast.success('Video call ended');
      onClose();
    } catch (error) {
      console.error('End video call error:', error);
      toast.error('Failed to end video call');
    }
  }, [appointment._id, onClose]);

  useEffect(() => {
    if (!isVideoCallActive) {
      handleInitiateVideoCall();
    }

    return () => {
      if (isInitiatingRef.current) return;
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [handleInitiateVideoCall, isVideoCallActive]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-4xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Video Call with{' '}
            {isInitiator
              ? appointment.patientId.name
              : appointment.doctorId?.name}
          </h3>
          <button
            onClick={handleEndVideoCall}
            className="text-white hover:text-gray-300"
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
        {isVideoCallActive && (
          <div className="flex flex-col md:flex-row gap-4">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full md:w-1/2 rounded-lg border border-white/20 shadow-lg"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              className="w-full md:w-1/2 rounded-lg border border-white/20 shadow-lg"
            />
          </div>
        )}
        <button
          onClick={handleEndVideoCall}
          className="mt-4 w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300"
        >
          End Call
        </button>
      </div>
    </div>
  );
};
