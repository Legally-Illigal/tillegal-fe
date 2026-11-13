import { apiClient, API_ENDPOINTS } from '@/lib/api'
import type {
  CurrentUserResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyRegistrationRequest,
  VerifyRegistrationResponse,
} from '../types/auth.types'

export const authApi = {
  getMe: (options?: { silent401?: boolean }): Promise<CurrentUserResponse> => {
    return apiClient.get<CurrentUserResponse>(API_ENDPOINTS.auth.me, options)
  },

  login: (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, data, {
      skipAuth: true,
    })
  },

  register: (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>(API_ENDPOINTS.auth.register, data, {
      skipAuth: true,
    })
  },

  verifyRegistration: (
    data: VerifyRegistrationRequest,
  ): Promise<VerifyRegistrationResponse> => {
    return apiClient.post<VerifyRegistrationResponse>(
      API_ENDPOINTS.auth.verifyRegistration,
      data,
      {
        skipAuth: true,
      },
    )
  },

  resendOtp: (data: ResendOtpRequest): Promise<ResendOtpResponse> => {
    return apiClient.post<ResendOtpResponse>(API_ENDPOINTS.auth.resendOtp, data, {
      skipAuth: true,
    })
  },

  loginGoogle: (data: GoogleAuthRequest): Promise<GoogleAuthResponse> => {
    return apiClient.post<GoogleAuthResponse>(API_ENDPOINTS.auth.loginGoogle, data, {
      skipAuth: true,
    })
  },

  registerGoogle: (data: GoogleAuthRequest): Promise<GoogleAuthResponse> => {
    return apiClient.post<GoogleAuthResponse>(API_ENDPOINTS.auth.registerGoogle, data, {
      skipAuth: true,
    })
  },

  logout: async (): Promise<LogoutResponse> => {
    return apiClient.post<LogoutResponse>(API_ENDPOINTS.auth.logout)
  },
}
