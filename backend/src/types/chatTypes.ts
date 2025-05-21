export interface ChatMessageResponse {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationResponse {
  _id: string;
  userId: string;
  type: 'appointment_booked' | 'appointment_cancelled' | 'appointment_reminder' | 'plan_subscribed';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export type VideoCallSettings = {
  patientAudio: boolean;
  patientVideo: boolean;
  doctorAudio: boolean;
  doctorVideo: boolean;
};

export interface InboxResponse {
  partnerId: string;
  partnerName: string;
  partnerProfilePicture?: string;
  latestMessage: {
    _id: string;
    message: string;
    createdAt: Date;
    isSender: boolean;
  } | null;
}
