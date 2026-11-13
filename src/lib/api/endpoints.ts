export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    verifyRegistration: '/auth/verify-registration',
    resendOtp: '/auth/resend-otp',
    login: '/auth/login',
    registerGoogle: '/auth/register/google',
    loginGoogle: '/auth/login/google',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  conversations: {
    list: '/conversations',
    create: '/conversations',
    detail: (id: string) => `/conversations/${id}`,
    messages: (id: string) => `/conversations/${id}/messages`,
    attachments: (id: string) => `/conversations/${id}/attachments`,
    attachmentDetail: (id: string, attachmentId: string) =>
      `/conversations/${id}/attachments/${attachmentId}`,
    attachmentDownload: (id: string, attachmentId: string) =>
      `/conversations/${id}/attachments/${attachmentId}/download`,
  },
  citations: {
    verify: '/citations/verify',
  },
  admin: {
    users: '/admin/users',
    userDetail: (id: string) => `/admin/users/${id}`,
    userStatus: (id: string) => `/admin/users/${id}/status`,
    grantLawyer: (id: string) => `/admin/users/${id}/grant-lawyer`,
    aiEvaluations: '/admin/ai-evaluations',
    aiEvaluationSummary: '/admin/ai-evaluations/summary',
    aiEvaluationDetail: (id: string) => `/admin/ai-evaluations/${id}`,
  },
} as const
