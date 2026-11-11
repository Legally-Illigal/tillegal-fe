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
    list: '/conversations',
    create: '/conversations',
    detail: (id: string) => `/conversations/${id}`,
    messages: (id: string) => `/conversations/${id}/messages`,
  },
  citations: {
    verify: '/citations/verify',
  },
} as const
