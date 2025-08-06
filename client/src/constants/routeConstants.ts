const API_BASE_PATH = '/api';

// Utility function to prepend API base path
const apiPath = (path: string) => `${API_BASE_PATH}${path}`;

export const ROUTES = {
  // Public Routes
  PUBLIC: {
    LANDING: '/',
    LOGIN: '/login',
    ADMIN_LOGIN: '/admin/login',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
    NOT_FOUND: '*',
  },

  // Patient Routes
  PATIENT: {
    BASE: '/patient',
    FIND_DOCTOR: '/patient/find-doctor',
    PROFILE: '/patient/profile',
    DOCTOR_DETAILS: '/patient/doctors/:doctorId',
    APPOINTMENT_DETAILS: '/patient/appointment/:appointmentId',
    MESSAGES: '/patient/profile?tab=messages',
  },

  // Doctor Routes
  DOCTOR: {
    BASE: '/doctor',
    DASHBOARD: '/doctor/dashboard',
    PROFILE: '/doctor/profile',
    AVAILABILITY: '/doctor/availability',
    APPOINTMENTS: '/doctor/appointments',
    MESSAGES: '/doctor/messages',
    PLANS: '/doctor/plans',
    PATIENT_DETAILS: '/doctor/patient/:patientId',
    APPOINTMENT_DETAILS: '/doctor/appointment/:appointmentId',
  },

  // Admin Routes
  ADMIN: {
    BASE: '/admin',
    DASHBOARD: '/admin/dashboard',
    MANAGE_DOCTORS: '/admin/manage-doctors',
    MANAGE_PATIENTS: '/admin/manage-patients',
    APPOINTMENTS: '/admin/appointments',
    PLAN_MANAGEMENT: '/admin/plan-management',
    SPECIALITIES: '/admin/specialities',
  },

  // API Endpoints (used in service files)
  API: {
    AUTH: {
      PATIENT_SIGNUP: apiPath('/auth/patient/signup'),
      DOCTOR_SIGNUP: apiPath('/auth/doctor/signup'),
      RESEND_SIGNUP_OTP: apiPath('/auth/resend-signup-otp'),
      VERIFY_SIGNUP_OTP: apiPath('/auth/verify-signup-otp'),
      PATIENT_LOGIN: apiPath('/auth/patient/login'),
      DOCTOR_LOGIN: apiPath('/auth/doctor/login'),
      ADMIN_LOGIN: apiPath('/auth/admin/login'),
      LOGOUT: apiPath('/auth/logout'),
      USER_PROFILE: apiPath('/user/me'),
      RESET_PASSWORD: apiPath('/auth/reset-password'),
      FORGOT_PASSWORD: apiPath('/auth/forgot-password'),
      GOOGLE_SIGNIN_PATIENT: apiPath('/auth/patient/google-signin'),
      GOOGLE_SIGNIN_DOCTOR: apiPath('/auth/doctor/google-signin'),
      REFRESH_TOKEN: apiPath('/auth/refresh-token'),
    },

    ADMIN: {
      DOCTORS: apiPath('/admin/doctors'),
      DOCTOR_BY_ID: apiPath('/admin/doctors/:id'),
      BLOCK_DOCTOR: apiPath('/admin/doctors/:id/block'),
      VERIFY_DOCTOR: apiPath('/admin/verify-doctor/:id'),
      PATIENTS: apiPath('/admin/patients'),
      PATIENT_BY_ID: apiPath('/admin/patients/:id'),
      BLOCK_PATIENT: apiPath('/admin/patients/:id/block'),
      APPOINTMENTS: apiPath('/admin/appointments'),
      CANCEL_APPOINTMENT: apiPath('/admin/appointments/:id/cancel'),
      SUBSCRIPTION_PLANS: apiPath('/admin/subscription-plans'),
      APPROVE_PLAN: apiPath('/admin/subscription-plans/:id/approve'),
      REJECT_PLAN: apiPath('/admin/subscription-plans/:id/reject'),
      DELETE_PLAN: apiPath('/admin/subscription-plans/:id'),
      SPECIALITIES: apiPath('/admin/specialities'),
      SPECIALITY_BY_ID: apiPath('/admin/specialities/:id'),
      DASHBOARD_STATS: apiPath('/admin/dashboard-stats'),
      REPORTS: apiPath('/admin/reports'),
    },

    DOCTOR: {
      AVAILABILITY: apiPath('/doctors/availability'),
      REMOVE_SLOT: apiPath('/doctors/availability/slots/remove'),
      UPDATE_SLOT: apiPath('/doctors/availability/slots'),
      APPOINTMENTS: apiPath('/doctors/appointments'),
      APPOINTMENT_BY_ID: apiPath('/doctors/appointments/:appointmentId'),
      PATIENT_APPOINTMENTS: apiPath('/doctors/patient/:patientId/appointments'),
      COMPLETE_APPOINTMENT: apiPath('/doctors/appointments/complete'),
      SUBSCRIPTION_PLANS: apiPath('/doctors/subscription-plans'),
      SUBSCRIPTION_PLAN_BY_ID: apiPath('/doctors/subscription-plans/:id'),
      WITHDRAW_SUBSCRIPTION_PLAN: apiPath(
        '/doctors/subscription-plans/:id/withdraw'
      ),
      SPECIALITIES: apiPath('/doctors/specialities'),
      DASHBOARD_STATS: apiPath('/doctors/dashboard/stats'),
      REPORTS: apiPath('/doctors/dashboard/reports'),
      SUBSCRIBED_PATIENTS: apiPath('/doctors/patients/subscribed'),
      SUBSCRIPTION_PLAN_COUNTS: apiPath('/doctors/subscription-plans/:planId/counts'),
    },

    PATIENT: {
      VERIFIED_DOCTORS: apiPath('/patients/doctors/verified'),
      DOCTOR_BY_ID: apiPath('/patients/doctors/:doctorId'),
      DOCTOR_AVAILABILITY: apiPath('/patients/doctors/:doctorId/availability'),
      DOCTOR_SUBSCRIPTION: apiPath('/patients/doctors/:doctorId/subscription'),
      APPOINTMENTS: apiPath('/patients/appointments'),
      BOOK_APPOINTMENT: apiPath('/patients/appointments'),
      CANCEL_APPOINTMENT: apiPath('/patients/appointments/:appointmentId'),
      DOCTOR_PLANS: apiPath('/patients/doctors/:doctorId/plans'),
      SUBSCRIBE_TO_PLAN: apiPath('/patients/subscriptions'),
      CONFIRM_SUBSCRIPTION: apiPath('/patients/subscriptions/confirm'),
      CANCEL_SUBSCRIPTION: apiPath('/patients/subscriptions/:subscriptionId'),
      CREATE_REVIEW: apiPath('/patients/review'),
      DOCTOR_REVIEWS: apiPath('/patients/doctors/:doctorId/reviews'),
      SUBSCRIPTION_LIST: '/api/patient/subscriptions',
    },

    MESSAGE: {
      INBOX: apiPath('/chat/inbox'),
      MESSAGES: apiPath('/chat/:receiverId'),
      PARTNER_DETAILS: apiPath('/user/:userId'),
      USER_STATUS: apiPath('/chat/status/:userId/:role'),
      SEND_MESSAGE: apiPath('/chat'),
      SEND_ATTACHMENT: apiPath('/chat/attachment'),
      DELETE_MESSAGE: apiPath('/chat/:messageId'),
      MARK_AS_READ: apiPath('/chat/:messageId/read'),
      ADD_REACTION: apiPath('/chat/:messageId/reaction'),
    },

    NOTIFICATION: {
      FETCH_NOTIFICATIONS: apiPath('/notifications'),
      DELETE_NOTIFICATION: apiPath('/notifications/:notificationId'),
      DELETE_ALL_NOTIFICATIONS: apiPath('/notifications'),
      MARK_AS_READ: apiPath('/notifications/:notificationId/read'),
    },
  },
};

export default ROUTES;
