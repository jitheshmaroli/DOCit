export const API_ROUTES = {
  ROOT: '/',
  AUTH: {
    PATIENT: {
      SIGNUP: '/api/auth/patient/signup',
      LOGIN: '/api/auth/patient/login',
      GOOGLE_SIGNIN: '/api/auth/patient/google-signin',
    },
    DOCTOR: {
      SIGNUP: '/api/auth/doctor/signup',
      LOGIN: '/api/auth/doctor/login',
      GOOGLE_SIGNIN: '/api/auth/doctor/google-signin',
    },
    ADMIN: {
      LOGIN: '/api/auth/admin/login',
    },
    SHARED: {
      LOGOUT: '/api/auth/logout',
      REFRESH_TOKEN: '/api/auth/refresh-token',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      VERIFY_SIGNUP_OTP: '/api/auth/verify-signup-otp',
    },
  },
  ADMIN: {
    DASHBOARD: {
      STATS: '/api/admin/dashboard-stats',
      REPORTS: '/api/admin/reports',
    },
    SUBSCRIPTION_PLANS: {
      BASE: '/api/admin/subscription-plans',
      APPROVE: (planId: string) => `/api/admin/subscription-plans/${planId}/approve`,
      REJECT: (planId: string) => `/api/admin/subscription-plans/${planId}/reject`,
      DELETE: (planId: string) => `/api/admin/subscription-plans/${planId}`,
    },
    SUBSCRIPTIONS: {
      BASE: '/api/admin/subscriptions',
    },
    APPOINTMENTS: {
      BASE: '/api/admin/appointments',
      CANCEL: (appointmentId: string) => `/api/admin/appointments/${appointmentId}/cancel`,
    },
    DOCTORS: {
      BASE: '/api/admin/doctors',
      BY_ID: (id: string) => `/api/admin/doctors/${id}`,
      VERIFY: (doctorId: string) => `/api/admin/verify-doctor/${doctorId}`,
      BLOCK: (id: string) => `/api/admin/doctors/${id}/block`,
    },
    PATIENTS: {
      BASE: '/api/admin/patients',
      BY_ID: (id: string) => `/api/admin/patients/${id}`,
      BLOCK: (id: string) => `/api/admin/patients/${id}/block`,
    },
    SPECIALITIES: {
      BASE: '/api/admin/specialities',
      BY_ID: (id: string) => `/api/admin/specialities/${id}`,
    },
  },
  DOCTOR: {
    AVAILABILITY: {
      BASE: '/api/doctors/availability',
      SLOTS: {
        REMOVE: '/api/doctors/availability/slots/remove',
        UPDATE: '/api/doctors/availability/slots',
      },
    },
    APPOINTMENTS: {
      BASE: '/api/doctors/appointments',
      BY_ID: (appointmentId: string) => `/api/doctors/appointments/${appointmentId}`,
      BY_PATIENT: (patientId: string) => `/api/doctors/patient/${patientId}/appointments`,
      COMPLETE: '/api/doctors/appointments/complete',
    },
    SUBSCRIPTION_PLANS: {
      BASE: '/api/doctors/subscription-plans',
      BY_ID: (id: string) => `/api/doctors/subscription-plans/${id}`,
    },
    SPECIALITIES: {
      BASE: '/api/doctors/specialities',
    },
    PROFILE: {
      BY_ID: (id: string) => `/api/doctors/${id}`,
    },
    DASHBOARD: {
      STATS: '/api/doctors/dashboard/stats',
      REPORTS: '/api/doctors/dashboard/reports',
    },
  },
  PATIENT: {
    DOCTORS: {
      VERIFIED: '/api/patients/doctors/verified',
      BY_ID: (doctorId: string) => `/api/patients/doctors/${doctorId}`,
      AVAILABILITY: (doctorId: string) => `/api/patients/doctors/${doctorId}/availability`,
      PLANS: (doctorId: string) => `/api/patients/doctors/${doctorId}/plans`,
      SUBSCRIPTION: (doctorId: string) => `/api/patients/doctors/${doctorId}/subscription`,
    },
    SPECIALITIES: {
      BASE: '/api/patients/specialities',
    },
    APPOINTMENTS: {
      BASE: '/api/patients/appointments',
      BY_ID: (appointmentId: string) => `/api/patients/appointments/${appointmentId}`,
    },
    SUBSCRIPTIONS: {
      BASE: '/api/patients/subscriptions',
      CONFIRM: '/api/patients/subscriptions/confirm',
    },
    PROFILE: {
      BY_ID: (id: string) => `/api/patients/${id}`,
    },
  },
  OTP: {
    SEND: '/api/otp/send-otp',
    VERIFY: '/api/otp/verify-otp',
  },
  NOTIFICATION: {
    BASE: '/api/notifications',
    BY_ID: (notificationId: string) => `/api/notifications/${notificationId}`,
    READ: (notificationId: string) => `/api/notifications/${notificationId}/read`,
    DELETE_ALL: '/api/notifications',
  },
  CHAT: {
    BASE: '/api/chat',
    INBOX: '/api/chat/inbox',
    BY_RECEIVER: (receiverId: string) => `/api/chat/${receiverId}`,
    BY_MESSAGE: (messageId: string) => `/api/chat/${messageId}`,
    READ: (messageId: string) => `/api/chat/${messageId}/read`,
    REACTION: (messageId: string) => `/api/chat/${messageId}/reaction`,
    ATTACHMENT: '/api/chat/attachment',
  },
  USER: {
    ME: '/api/user/me',
    BY_ID: (userId: string) => `/api/user/${userId}`,
  },
  WEBHOOK: {
    STRIPE: '/api/webhook/stripe',
  },
} as const;
