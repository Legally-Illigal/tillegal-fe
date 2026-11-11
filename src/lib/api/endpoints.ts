export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyRegistration: '/auth/verify-registration',
    resendOtp: '/auth/resend-otp',
    login: '/auth/login',
    registerGoogle: '/auth/register/google',
    loginGoogle: '/auth/login/google',
  },
  conversations: {
    create: '/conversations',
    messages: (id: string) => `/conversations/${id}/messages`,
  },
  citations: {
    verify: '/citations/verify',
  },
} as const
