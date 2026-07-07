export interface SignalData {
  appointmentId: string;
  senderId: string;
  signal: unknown;
}

export interface CallEndData {
  appointmentId: string;
  enderId: string;
}

export interface HandRaiseData {
  appointmentId: string;
  userId: string;
  isRaised: boolean;
}

export interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  userId: string;
  receiverId: string;
  isCaller: boolean;
  callerInfo?: { callerId: string; callerRole: string } | null;
}