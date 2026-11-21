import { apiClient, API_ENDPOINTS } from '@/lib/api'
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  UpdateUserProfileRequest,
  UserProfileResponse,
} from '../types/user.types'

export const userApi = {
  getProfile: (options?: { silent401?: boolean }): Promise<UserProfileResponse> => {
    return apiClient.get<UserProfileResponse>(API_ENDPOINTS.users.me, options)
  },

  updateProfile: (data: UpdateUserProfileRequest): Promise<UserProfileResponse> => {
    return apiClient.put<UserProfileResponse>(API_ENDPOINTS.users.me, data)
  },

  changePassword: (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    return apiClient.put<ChangePasswordResponse>(API_ENDPOINTS.users.changePassword, data)
  },

  deactivateAccount: (): Promise<void> => {
    return apiClient.delete<void>(API_ENDPOINTS.users.me)
  },
}
