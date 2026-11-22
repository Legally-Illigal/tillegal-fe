import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatAuthError, useAuth } from '@/features/auth'
import { userApi } from '../api/user-api'
import type { UserProfileResponse } from '../types/user.types'

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/

export function useUserProfile() {
  const { user, updateUser, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false)
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await userApi.getProfile({ silent401: true })
      setProfile(data)
      return data
    } catch (err) {
      const msg = formatAuthError(err, 'Không thể tải thông tin hồ sơ người dùng.')
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (
    fullName: string,
    phoneNumber?: string | null,
  ): Promise<boolean> => {
    const trimmedName = fullName.trim()
    if (!trimmedName) {
      toast.error('Vui lòng nhập họ và tên.')
      return false
    }
    if (trimmedName.length > 150) {
      toast.error('Họ và tên không được vượt quá 150 ký tự.')
      return false
    }

    const trimmedPhone = phoneNumber?.trim() || null
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      toast.error('Số điện thoại không đúng định dạng (từ 7 đến 20 ký tự số).')
      return false
    }

    setIsUpdating(true)
    try {
      const updated = await userApi.updateProfile({
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
      })
      setProfile(updated)
      updateUser({
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber,
      })
      toast.success('Cập nhật thông tin tài khoản thành công.')
      return true
    } catch (err) {
      const msg = formatAuthError(err, 'Cập nhật thông tin tài khoản thất bại.')
      toast.error(msg)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const changePassword = async (
    newPassword: string,
    confirmPassword: string,
  ): Promise<boolean> => {
    if (!newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới.')
      return false
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự.')
      return false
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa (A-Z).')
      return false
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Mật khẩu mới phải chứa ít nhất 1 chữ cái thường (a-z).')
      return false
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error('Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9).')
      return false
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp.')
      return false
    }

    setIsChangingPassword(true)
    try {
      const res = await userApi.changePassword({ newPassword })
      toast.success(res.message || 'Mật khẩu đã được cập nhật thành công.')
      return true
    } catch (err) {
      const msg = formatAuthError(err, 'Đổi mật khẩu thất bại. Vui lòng thử lại.')
      toast.error(msg)
      return false
    } finally {
      setIsChangingPassword(false)
    }
  }

  const deactivateAccount = async (): Promise<boolean> => {
    const isAdmin =
      user?.role?.toLowerCase() === 'admin' || profile?.role?.toLowerCase() === 'admin'

    if (isAdmin) {
      toast.error('Quản trị viên không thể tự vô hiệu hóa tài khoản của chính mình.')
      return false
    }

    setIsDeactivating(true)
    try {
      await userApi.deactivateAccount()
      toast.info('Tài khoản của bạn đã được vô hiệu hóa thành công.')
      logout()
      return true
    } catch (err) {
      const msg = formatAuthError(err, 'Không thể vô hiệu hóa tài khoản.')
      toast.error(msg)
      return false
    } finally {
      setIsDeactivating(false)
    }
  }

  return {
    profile,
    isLoading,
    isUpdating,
    isChangingPassword,
    isDeactivating,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
    deactivateAccount,
  }
}
