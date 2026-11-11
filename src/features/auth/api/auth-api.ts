import { apiClient, API_ENDPOINTS } from '@/lib/api'
import type {
  GoogleAuthRequest,
  GoogleAuthResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  VerifyRegistrationRequest,
  VerifyRegistrationResponse,
} from '../types/auth.types'

export const authApi = {
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
}
