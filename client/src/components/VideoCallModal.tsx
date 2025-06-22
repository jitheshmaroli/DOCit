import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { SocketManager } from '../services/SocketManager';
import { Patient } from '../types/authTypes';

interface AppointmentDoctor {
  _id: string;
  name: string;
  profilePicture?: string;
  speciality?: string[];
  qualifications?: string[];
  age?: number;
  gender?: string;
}

interface Appointment {
  _id: string;
  patientId: string | Patient;
  doctorId: AppointmentDoctor | string;
  date: string;
  startTime: string;
  endTime: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  isFreeBooking?: boolean;
  bookingTime?: string;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
  patientName?: string | undefined;
  doctorName?: string | undefined;
}

interface VideoCallModalProps {
  appointment: Appointment;
  isCaller: boolean;
  onClose: () => void;
  doctorName?: string;
  patientName?: string;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  appointment,
  isCaller,
  onClose,
  doctorName,
  patientName,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [callStatus, setCallStatus] = useState<
    'pending' | 'connecting' | 'connected' | 'failed' | 'ended'
  >('pending');
  const socketManager = SocketManager.getInstance();
  const localStreamRef = useRef<MediaStream | undefined>(undefined);
  const hasEndedCall = useRef<boolean>(false);
  const isSettingUp = useRef<boolean>(false);
  const pendingIceCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffers = useRef<
    { offer: RTCSessionDescriptionInit; from: string; appointmentId: string }[]
  >([]);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const endCall = () => {
    if (hasEndedCall.current) {
      console.log('endCall already invoked, skipping');
      return;
    }
    hasEndedCall.current = true;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = undefined;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;

    const toId = isCaller
      ? typeof appointment.patientId === 'string'
        ? appointment.patientId
        : appointment.patientId._id
      : typeof appointment.doctorId === 'string'
        ? appointment.doctorId
        : appointment.doctorId._id;
    const fromId = isCaller
      ? typeof appointment.doctorId === 'string'
        ? appointment.doctorId
        : appointment.doctorId._id
      : typeof appointment.patientId === 'string'
        ? appointment.patientId
        : appointment.patientId._id;

    socketManager.emit('endCall', {
      appointmentId: appointment._id,
      to: toId,
      from: fromId,
    });

    setCallStatus('ended');
    onClose();
  };

  const processPendingOffers = async () => {
    if (!peerConnectionRef.current || isSettingUp.current) {
      console.log(
        'Cannot process pending offers: peer connection not ready or setup in progress'
      );
      return;
    }
    while (pendingOffers.current.length > 0) {
      const data = pendingOffers.current.shift();
      if (!data) continue;
      console.log('Processing pending offer:', data);
      if (data.appointmentId !== appointment._id || hasEndedCall.current) {
        console.log(
          'Ignoring pending offer: invalid appointment or call ended',
          data
        );
        continue;
      }
      try {
        console.log(
          'Setting remote description with pending offer:',
          data.offer
        );
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.offer)
        );
        console.log(
          'Applying buffered ICE candidates:',
          pendingIceCandidates.current.length
        );
        while (pendingIceCandidates.current.length > 0) {
          const candidate = pendingIceCandidates.current.shift();
          if (candidate) {
            console.log('Applying buffered ICE candidate:', candidate);
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        }
        console.log('Creating answer for pending offer...');
        const answer = await peerConnectionRef.current.createAnswer();
        console.log('Setting local description with answer:', answer);
        await peerConnectionRef.current.setLocalDescription(answer);

        const toId = data.from;
        const fromId = isCaller
          ? typeof appointment.doctorId === 'string'
            ? appointment.doctorId
            : appointment.doctorId._id
          : typeof appointment.patientId === 'string'
            ? appointment.patientId
            : appointment.patientId._id;

        console.log('Sending answer for pending offer:', {
          appointmentId: appointment._id,
          to: toId,
          from: fromId,
          answer,
        });
        socketManager.emit('answer', {
          appointmentId: appointment._id,
          to: toId,
          from: fromId,
          answer,
        });
      } catch (error) {
        console.error('Failed to process pending offer:', error, data);
        setCallStatus('failed');
        toast.error('Failed to establish call');
        if (!hasEndedCall.current) endCall();
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    isSettingUp.current = true;

    const setupWebRTC = async () => {
      if (!isMounted || hasEndedCall.current) return;

      try {
        setCallStatus('connecting');

        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            // Uncomment and configure TURN server if available
            // {
            //   urls: 'turn:your-turn-server.com:3478',
            //   username: 'your-username',
            //   credential: 'your-credential',
            // },
          ],
        });

        try {
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          console.log(
            'Local stream acquired with tracks:',
            localStreamRef.current.getTracks()
          );
          if (localVideoRef.current && isMounted) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current
              .play()
              .catch((e) => console.error('Local video play error:', e));
          }
          if (peerConnectionRef.current && isMounted) {
            localStreamRef.current.getTracks().forEach((track) => {
              console.log('Adding track to peer connection:', track);
              peerConnectionRef.current!.addTrack(
                track,
                localStreamRef.current!
              );
            });
          }
        } catch (mediaError) {
          console.error('Failed to get media stream:', mediaError);
          toast.error('Failed to access camera or microphone');
          setCallStatus('failed');
          if (isMounted) endCall();
          return;
        }

        if (peerConnectionRef.current && isMounted) {
          peerConnectionRef.current.ontrack = (event) => {
            console.log('ontrack event:', event, 'Streams:', event.streams);
            if (!remoteVideoRef.current || !isMounted || hasEndedCall.current) {
              console.warn('Remote video ref not available or call ended');
              return;
            }
            if (event.streams && event.streams[0]) {
              const remoteStream = event.streams[0];
              console.log('Remote stream tracks:', remoteStream.getTracks());
              if (!remoteStreamRef.current) {
                remoteStreamRef.current = remoteStream;
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play().catch((e) => {
                  console.error('Remote video play error:', e);
                  toast.error('Failed to play remote video');
                });
                setCallStatus('connected');
              }
            } else {
              console.warn('No streams in ontrack event');
              setCallStatus('failed');
              toast.error('No remote video stream received');
              if (isMounted) endCall();
            }
          };
        }

        if (peerConnectionRef.current && isMounted) {
          peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate && isMounted && !hasEndedCall.current) {
              console.log('Sending ICE candidate:', event.candidate);
              const toId = isCaller
                ? typeof appointment.patientId === 'string'
                  ? appointment.patientId
                  : appointment.patientId._id
                : typeof appointment.doctorId === 'string'
                  ? appointment.doctorId
                  : appointment.doctorId._id;
              const fromId = isCaller
                ? typeof appointment.doctorId === 'string'
                  ? appointment.doctorId
                  : appointment.doctorId._id
                : typeof appointment.patientId === 'string'
                  ? appointment.patientId
                  : appointment.patientId._id;

              socketManager.emit('iceCandidate', {
                appointmentId: appointment._id,
                to: toId,
                from: fromId,
                candidate: event.candidate,
              });
            }
          };
        }

        if (peerConnectionRef.current && isMounted) {
          peerConnectionRef.current.onconnectionstatechange = () => {
            if (!peerConnectionRef.current || !isMounted) return;
            const state = peerConnectionRef.current.connectionState;
            console.log('Connection state:', state);
            if (state === 'failed' || state === 'disconnected') {
              setCallStatus('failed');
              toast.error('Call connection failed');
              if (isMounted) endCall();
            } else if (state === 'connected') {
              console.log('WebRTC connection established');
            }
          };
        }

        socketManager.registerHandlers({
          onReceiveOffer: async (data: {
            offer: RTCSessionDescriptionInit;
            from: string;
            appointmentId: string;
          }) => {
            if (
              data.appointmentId !== appointment._id ||
              !isMounted ||
              hasEndedCall.current
            ) {
              console.log(
                'Ignoring offer: invalid appointment or call ended',
                data
              );
              return;
            }
            if (isSettingUp.current || !peerConnectionRef.current) {
              console.log(
                'Buffering offer: setup in progress or peer connection not ready',
                data
              );
              pendingOffers.current.push(data);
              return;
            }
            console.log('Received offer:', data);
            try {
              console.log('Setting remote description with offer:', data.offer);
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(data.offer)
              );
              console.log(
                'Applying buffered ICE candidates:',
                pendingIceCandidates.current.length
              );
              while (pendingIceCandidates.current.length > 0) {
                const candidate = pendingIceCandidates.current.shift();
                if (candidate) {
                  console.log('Applying buffered ICE candidate:', candidate);
                  await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                }
              }
              console.log('Creating answer...');
              const answer = await peerConnectionRef.current.createAnswer();
              console.log('Setting local description with answer:', answer);
              await peerConnectionRef.current.setLocalDescription(answer);

              const toId = data.from;
              const fromId = isCaller
                ? typeof appointment.doctorId === 'string'
                  ? appointment.doctorId
                  : appointment.doctorId._id
                : typeof appointment.patientId === 'string'
                  ? appointment.patientId
                  : appointment.patientId._id;

              console.log('Sending answer:', {
                appointmentId: appointment._id,
                to: toId,
                from: fromId,
                answer,
              });
              socketManager.emit('answer', {
                appointmentId: appointment._id,
                to: toId,
                from: fromId,
                answer,
              });
            } catch (error) {
              console.error('Failed to handle offer:', error, data);
              setCallStatus('failed');
              toast.error('Failed to establish call');
              if (isMounted) endCall();
            }
          },
          onReceiveAnswer: async (data: {
            answer: RTCSessionDescriptionInit;
            appointmentId: string;
            from?: string;
          }) => {
            if (
              data.appointmentId !== appointment._id ||
              !isMounted ||
              hasEndedCall.current
            ) {
              console.log(
                'Ignoring answer: invalid appointment or call ended',
                data
              );
              return;
            }
            if (!peerConnectionRef.current) {
              console.error(
                'Peer connection not initialized for answer:',
                data
              );
              return;
            }
            console.log('Received answer:', data);
            try {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              while (pendingIceCandidates.current.length > 0) {
                const candidate = pendingIceCandidates.current.shift();
                if (candidate) {
                  console.log('Applying buffered ICE candidate:', candidate);
                  await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                  );
                }
              }
            } catch (error) {
              console.error('Failed to handle answer:', error, data);
              setCallStatus('failed');
              toast.error('Failed to establish call');
              if (isMounted) endCall();
            }
          },
          onReceiveIceCandidate: async (data: {
            candidate: RTCIceCandidateInit;
            appointmentId: string;
            from?: string;
          }) => {
            if (
              data.appointmentId !== appointment._id ||
              !isMounted ||
              hasEndedCall.current
            ) {
              console.log(
                'Ignoring ICE candidate: invalid appointment or call ended',
                data
              );
              return;
            }
            if (!peerConnectionRef.current) {
              console.error(
                'Peer connection not initialized for ICE candidate:',
                data
              );
              return;
            }
            console.log('Received ICE candidate:', data);
            try {
              if (peerConnectionRef.current.remoteDescription) {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(data.candidate)
                );
              } else {
                console.log(
                  'Buffering ICE candidate, no remote description yet'
                );
                pendingIceCandidates.current.push(data.candidate);
              }
            } catch (error) {
              console.error('Failed to add ICE candidate:', error, data);
            }
          },
          onCallEnded: (data: { appointmentId: string }) => {
            if (
              data.appointmentId !== appointment._id ||
              !isMounted ||
              hasEndedCall.current
            ) {
              console.log(
                'Ignoring callEnded: invalid appointment or call ended',
                data
              );
              return;
            }
            console.log('Received callEnded:', data);
            if (isMounted) endCall();
          },
        });

        if (
          isCaller &&
          peerConnectionRef.current &&
          isMounted &&
          !hasEndedCall.current
        ) {
          try {
            console.log('Creating offer...');
            const offer = await peerConnectionRef.current.createOffer();
            console.log('Setting local description with offer:', offer);
            await peerConnectionRef.current.setLocalDescription(offer);

            const toId =
              typeof appointment.patientId === 'string'
                ? appointment.patientId
                : appointment.patientId._id;
            const fromId =
              typeof appointment.doctorId === 'string'
                ? appointment.doctorId
                : appointment.doctorId._id;

            console.log('Sending offer:', {
              appointmentId: appointment._id,
              to: toId,
              from: fromId,
              offer,
            });
            socketManager.emit('offer', {
              appointmentId: appointment._id,
              to: toId,
              from: fromId,
              offer,
            });
          } catch (error) {
            console.error('Failed to create offer:', error);
            setCallStatus('failed');
            toast.error('Failed to initiate call');
            if (isMounted) endCall();
          }
        }

        // Process any buffered offers after setup
        await processPendingOffers();
      } catch (error) {
        console.error('WebRTC setup failed:', error);
        toast.error('Failed to initialize video call');
        setCallStatus('failed');
        if (isMounted) endCall();
      } finally {
        isSettingUp.current = false;
      }
    };

    setupWebRTC();

    return () => {
      isMounted = false;
      if (!isSettingUp.current && !hasEndedCall.current) {
        endCall();
      }
    };
  }, [appointment, isCaller, socketManager]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-2xl max-w-4xl w-full p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Video Call with {isCaller ? patientName : doctorName}
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg"
            />
            <p className="text-white text-center mt-2">
              {isCaller ? patientName : doctorName}
            </p>
          </div>
          <div className="flex-1">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 bg-black rounded-lg"
            />
            <p className="text-white text-center mt-2">You</p>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-6">
          {callStatus === 'pending' && (
            <p className="text-gray-300">Initializing...</p>
          )}
          {callStatus === 'connecting' && (
            <p className="text-yellow-300">Connecting...</p>
          )}
          {callStatus === 'failed' && (
            <p className="text-red-300">Call Failed</p>
          )}
          {callStatus === 'connected' && (
            <p className="text-green-300">Connected</p>
          )}
          <button
            onClick={endCall}
            disabled={hasEndedCall.current}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
