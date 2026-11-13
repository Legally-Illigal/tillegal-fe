export type UserRole = 'Admin' | 'User' | 'Lawyer' | string

export interface LoginUserInfo {
  id: string
  email: string
  fullName: string
  phoneNumber?: string | null
  role?: UserRole | null
}

export interface UserProfile extends LoginUserInfo {}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: LoginUserInfo
  message: string
  accessToken?: string
  expiresIn?: number
}

export interface CurrentUserResponse {
  id: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  role: UserRole | null
  isActive: boolean
}

export interface LogoutResponse {
  message: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phoneNumber?: string
}

export interface RegisterResponse {
  message: string
  expirationMinutes: number
}

export interface VerifyRegistrationRequest {
  email: string
  otp: string
}

export interface VerifyRegistrationResponse {
  userId: string
  email: string
  fullName: string
  message: string
}

export interface VerifyRegistrationResult {
  verified: boolean
  autoLoggedIn: boolean
  email: string
  fullName: string
}

export interface ResendOtpRequest {
  email: string
}

export interface ResendOtpResponse {
  message: string
  expirationMinutes: number
}

export interface GoogleAuthRequest {
  idToken: string
}

export interface GoogleAuthResponse {
  userId: string
  email: string
  fullName: string
  message: string
  accessToken?: string
}

export interface AuthState {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}
