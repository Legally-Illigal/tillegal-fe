import type { UserRole } from '@/features/auth'

export interface UserProfileResponse {
  id: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  role: UserRole | null
  isActive: boolean
  createdAt: string
  lastActiveAt: string | null
}

export interface UpdateUserProfileRequest {
  fullName: string
  phoneNumber?: string | null
}

export interface ChangePasswordRequest {
  newPassword: string
}

export interface ChangePasswordResponse {
  message: string
}
