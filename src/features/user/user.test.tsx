import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { userApi } from './api/user-api'
import { formatUserDateTime, getUserRoleLabel } from './utils/user-formatters'
import { ProfileInfoForm } from './components/profile-info-form'
import { ChangePasswordForm } from './components/change-password-form'
import { DeactivateAccountCard } from './components/deactivate-account-card'
import { ProfilePage } from '@/pages/profile/profile-page'
import { AuthProvider } from '@/features/auth/context/auth-provider'
import type { UserProfileResponse } from './types/user.types'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const mockProfile: UserProfileResponse = {
  id: 'user-guid-001',
  fullName: 'Nguyễn Văn A',
  email: 'nguyenvana@example.com',
  phoneNumber: '0912345678',
  role: 'User',
  isActive: true,
  createdAt: '2026-11-10T10:00:00Z',
  lastActiveAt: '2026-11-18T15:30:00Z',
}

const mockAdminProfile: UserProfileResponse = {
  ...mockProfile,
  id: 'admin-guid-002',
  role: 'Admin',
  fullName: 'Admin User',
  email: 'admin@tillegal.vn',
}

describe('User Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('userApi contracts', () => {
    it('calls getProfile endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockProfile)

      const result = await userApi.getProfile({ silent401: true })

      expect(apiClient.get).toHaveBeenCalledWith('/users/me', { silent401: true })
      expect(result).toEqual(mockProfile)
    })

    it('calls updateProfile endpoint with PUT', async () => {
      const updateData = { fullName: 'Nguyễn Văn B', phoneNumber: '0987654321' }
      const updatedProfile = { ...mockProfile, ...updateData }
      vi.mocked(apiClient.put).mockResolvedValueOnce(updatedProfile)

      const result = await userApi.updateProfile(updateData)

      expect(apiClient.put).toHaveBeenCalledWith('/users/me', updateData)
      expect(result).toEqual(updatedProfile)
    })

    it('calls changePassword endpoint with PUT', async () => {
      const req = { newPassword: 'NewPassword123!' }
      const res = { message: 'Password has been successfully updated.' }
      vi.mocked(apiClient.put).mockResolvedValueOnce(res)

      const result = await userApi.changePassword(req)

      expect(apiClient.put).toHaveBeenCalledWith('/users/me/password', req)
      expect(result).toEqual(res)
    })

    it('calls deactivateAccount endpoint with DELETE', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce(undefined)

      await userApi.deactivateAccount()

      expect(apiClient.delete).toHaveBeenCalledWith('/users/me')
    })
  })

  describe('user-formatters', () => {
    it('formats date time accurately in Vietnamese locale', () => {
      expect(formatUserDateTime(null)).toBe('Chưa ghi nhận')
      expect(formatUserDateTime('invalid-date')).toBe('Không xác định')
      const formatted = formatUserDateTime('2026-11-18T10:30:00Z')
      expect(formatted).toMatch(/\d{2}\/\d{2}\/2026/)
    })

    it('maps role codes to Vietnamese labels', () => {
      expect(getUserRoleLabel('Admin')).toBe('Quản trị viên')
      expect(getUserRoleLabel('admin')).toBe('Quản trị viên')
      expect(getUserRoleLabel('Lawyer')).toBe('Luật sư')
      expect(getUserRoleLabel('lawyer')).toBe('Luật sư')
      expect(getUserRoleLabel('User')).toBe('Người dân')
      expect(getUserRoleLabel('citizen')).toBe('Người dân')
      expect(getUserRoleLabel(null)).toBe('Người dân')
    })
  })

  describe('ProfileInfoForm component', () => {
    it('renders profile data and disables email input', () => {
      render(
        <ProfileInfoForm profile={mockProfile} isUpdating={false} onUpdate={vi.fn()} />,
      )

      expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument()
      const emailInput = screen.getByDisplayValue('nguyenvana@example.com')
      expect(emailInput).toBeDisabled()
      expect(screen.getByDisplayValue('0912345678')).toBeInTheDocument()
      expect(screen.getByText('Người dân')).toBeInTheDocument()
      expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()
    })

    it('validates full name requirement', async () => {
      const onUpdate = vi.fn()
      render(
        <ProfileInfoForm profile={mockProfile} isUpdating={false} onUpdate={onUpdate} />,
      )

      const nameInput = screen.getByDisplayValue('Nguyễn Văn A')
      fireEvent.change(nameInput, { target: { value: '   ' } })

      const submitBtn = screen.getByRole('button', { name: /lưu thay đổi/i })
      fireEvent.click(submitBtn)

      expect(screen.getByText('Vui lòng nhập họ và tên.')).toBeInTheDocument()
      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('validates phone number regex format', async () => {
      const onUpdate = vi.fn()
      render(
        <ProfileInfoForm profile={mockProfile} isUpdating={false} onUpdate={onUpdate} />,
      )

      const phoneInput = screen.getByDisplayValue('0912345678')
      fireEvent.change(phoneInput, { target: { value: 'abc12345' } })

      const submitBtn = screen.getByRole('button', { name: /lưu thay đổi/i })
      fireEvent.click(submitBtn)

      expect(screen.getByText(/số điện thoại không đúng định dạng/i)).toBeInTheDocument()
      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('submits updated values when valid', async () => {
      const onUpdate = vi.fn().mockResolvedValue(true)
      render(
        <ProfileInfoForm profile={mockProfile} isUpdating={false} onUpdate={onUpdate} />,
      )

      const nameInput = screen.getByDisplayValue('Nguyễn Văn A')
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn Mới' } })

      const submitBtn = screen.getByRole('button', { name: /lưu thay đổi/i })
      fireEvent.click(submitBtn)

      expect(onUpdate).toHaveBeenCalledWith('Nguyễn Văn Mới', '0912345678')
    })

    it('resets form when clicking reset button', () => {
      render(
        <ProfileInfoForm profile={mockProfile} isUpdating={false} onUpdate={vi.fn()} />,
      )

      const nameInput = screen.getByDisplayValue('Nguyễn Văn A')
      fireEvent.change(nameInput, { target: { value: 'Tên Tạm' } })
      expect(screen.getByDisplayValue('Tên Tạm')).toBeInTheDocument()

      const resetBtn = screen.getByRole('button', { name: /đặt lại/i })
      fireEvent.click(resetBtn)

      expect(screen.getByDisplayValue('Nguyễn Văn A')).toBeInTheDocument()
    })
  })

  describe('ChangePasswordForm component', () => {
    it('validates password requirements live', async () => {
      const onChangePassword = vi.fn().mockResolvedValue(true)
      render(
        <ChangePasswordForm
          isChangingPassword={false}
          onChangePassword={onChangePassword}
        />,
      )

      const submitBtn = screen.getByRole('button', { name: /cập nhật mật khẩu/i })
      expect(submitBtn).toBeDisabled()

      const newPassInput = screen.getByPlaceholderText('Nhập mật khẩu mới')
      const confirmPassInput = screen.getByPlaceholderText('Nhập lại mật khẩu mới')

      // Typing valid matching passwords
      await act(async () => {
        fireEvent.change(newPassInput, { target: { value: 'StrongPass123!' } })
        fireEvent.change(confirmPassInput, { target: { value: 'StrongPass123!' } })
      })

      expect(submitBtn).not.toBeDisabled()

      await act(async () => {
        fireEvent.click(submitBtn)
      })
      expect(onChangePassword).toHaveBeenCalledWith('StrongPass123!', 'StrongPass123!')
    })

    it('toggles password visibility', () => {
      render(<ChangePasswordForm isChangingPassword={false} onChangePassword={vi.fn()} />)

      const newPassInput = screen.getByPlaceholderText('Nhập mật khẩu mới')
      expect(newPassInput).toHaveAttribute('type', 'password')

      const toggleBtns = screen.getAllByRole('button', { name: /hiện mật khẩu/i })
      expect(toggleBtns[0]).toBeDefined()
      fireEvent.click(toggleBtns[0]!)

      expect(newPassInput).toHaveAttribute('type', 'text')
    })
  })

  describe('DeactivateAccountCard component', () => {
    it('prevents Admin from self-deactivating', () => {
      render(
        <DeactivateAccountCard
          profile={mockAdminProfile}
          isDeactivating={false}
          onDeactivate={vi.fn()}
        />,
      )

      expect(screen.getByText(/giới hạn đặc quyền quản trị/i)).toBeInTheDocument()
      const deactivateBtn = screen.getByRole('button', { name: /vô hiệu hóa tài khoản/i })
      expect(deactivateBtn).toBeDisabled()
    })

    it('allows non-admin user to open confirmation dialog and confirm', async () => {
      const onDeactivate = vi.fn().mockResolvedValue(true)
      render(
        <DeactivateAccountCard
          profile={mockProfile}
          isDeactivating={false}
          onDeactivate={onDeactivate}
        />,
      )

      const deactivateBtn = screen.getByRole('button', { name: /vô hiệu hóa tài khoản/i })
      expect(deactivateBtn).not.toBeDisabled()

      await act(async () => {
        fireEvent.click(deactivateBtn)
      })

      // Dialog opens
      expect(screen.getByText('Xác nhận vô hiệu hóa tài khoản')).toBeInTheDocument()

      const confirmBtn = screen.getByRole('button', { name: /vô hiệu hóa ngay/i })
      await act(async () => {
        fireEvent.click(confirmBtn)
      })

      expect(onDeactivate).toHaveBeenCalled()
    })
  })

  describe('ProfilePage integration', () => {
    it('renders profile page with tabs and tab switching', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockProfile)

      localStorage.setItem(
        'tillegal_user_profile',
        JSON.stringify({
          id: mockProfile.id,
          email: mockProfile.email,
          fullName: mockProfile.fullName,
          role: mockProfile.role,
        }),
      )

      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AuthProvider>
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(await screen.findByText('Thông tin cá nhân')).toBeInTheDocument()
      expect(screen.getByText('Đổi mật khẩu')).toBeInTheDocument()
      expect(screen.getByText('Vô hiệu hóa')).toBeInTheDocument()

      // Switch to Đổi mật khẩu
      await user.click(screen.getByRole('tab', { name: /đổi mật khẩu/i }))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nhập mật khẩu mới')).toBeInTheDocument()
      })

      // Switch to Vô hiệu hóa
      await user.click(screen.getByRole('tab', { name: /vô hiệu hóa/i }))
      await waitFor(() => {
        expect(screen.getByText(/vùng nguy hiểm/i)).toBeInTheDocument()
      })
    })
  })
})
