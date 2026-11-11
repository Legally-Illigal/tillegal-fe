import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { apiClient } from '@/lib/api'
import { authApi } from './api/auth-api'
import { formatAuthError, translateAuthMessage } from './utils/auth-error-helper'
import { LoginForm } from './components/login-form'
import { RegisterForm } from './components/register-form'
import { AuthProvider } from './context/auth-provider'
import { useAuth } from './hooks/use-auth'

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

describe('Auth Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('authApi contracts', () => {
    it('calls login endpoint with skipAuth', async () => {
      const mockResponse = {
        user: {
          id: 'u-1',
          email: 'test@example.com',
          fullName: 'Test User',
          phoneNumber: '0912345678',
          role: 'User',
        },
        message: 'Login successful.',
      }
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.login({
        email: 'test@example.com',
        password: 'Password123!',
      })

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login',
        { email: 'test@example.com', password: 'Password123!' },
        { skipAuth: true },
      )
      expect(result).toEqual(mockResponse)
    })

    it('calls register endpoint with skipAuth', async () => {
      const mockResponse = {
        message: 'Mã xác thực OTP đã được gửi.',
        expirationMinutes: 10,
      }
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.register({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        phoneNumber: '0912345678',
      })

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/register',
        {
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
          phoneNumber: '0912345678',
        },
        { skipAuth: true },
      )
      expect(result).toEqual(mockResponse)
    })

    it('calls verifyRegistration endpoint with skipAuth', async () => {
      const mockResponse = {
        userId: 'u-1',
        email: 'test@example.com',
        fullName: 'Test User',
        message: 'Xác thực tài khoản thành công.',
      }
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.verifyRegistration({
        email: 'test@example.com',
        otp: '123456',
      })

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/verify-registration',
        { email: 'test@example.com', otp: '123456' },
        { skipAuth: true },
      )
      expect(result).toEqual(mockResponse)
    })

    it('calls resendOtp endpoint with skipAuth', async () => {
      const mockResponse = {
        message: 'Mã OTP mới đã được gửi.',
        expirationMinutes: 10,
      }
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.resendOtp({ email: 'test@example.com' })

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/resend-otp',
        { email: 'test@example.com' },
        { skipAuth: true },
      )
      expect(result).toEqual(mockResponse)
    })

    it('calls Google endpoints correctly', async () => {
      const mockGoogleRes = {
        userId: 'u-google',
        email: 'user@gmail.com',
        fullName: 'Google User',
        message: 'Google auth successful',
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockGoogleRes)

      const loginRes = await authApi.loginGoogle({ idToken: 'sample-token' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/login/google',
        { idToken: 'sample-token' },
        { skipAuth: true },
      )
      expect(loginRes).toEqual(mockGoogleRes)

      const regRes = await authApi.registerGoogle({ idToken: 'sample-token' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/register/google',
        { idToken: 'sample-token' },
        { skipAuth: true },
      )
      expect(regRes).toEqual(mockGoogleRes)
    })
  })

  describe('auth-error-helper', () => {
    it('translates common backend English error messages to Vietnamese', () => {
      expect(translateAuthMessage('Invalid email or password.')).toBe(
        'Địa chỉ email hoặc mật khẩu không chính xác.',
      )
      expect(
        translateAuthMessage("Email 'user@example.com' is already registered."),
      ).toContain('đã được đăng ký')
      expect(translateAuthMessage('Invalid verification code.')).toContain(
        'Mã xác thực OTP không chính xác',
      )
      expect(
        translateAuthMessage(
          'Verification code has expired or registration request does not exist.',
        ),
      ).toContain('Mã OTP đã hết hạn')
      expect(
        translateAuthMessage('Password must contain at least one uppercase letter.'),
      ).toContain('chữ cái in hoa')
      expect(
        translateAuthMessage('Password must contain at least one lowercase letter.'),
      ).toContain('chữ cái thường')
      expect(
        translateAuthMessage('Password must contain at least one number.'),
      ).toContain('chữ số')
      expect(translateAuthMessage('Invalid phone number format.')).toContain(
        'Số điện thoại không đúng định dạng',
      )
    })

    it('formats error objects gracefully with fallback', () => {
      expect(formatAuthError(new Error('Invalid email or password.'), 'Lỗi')).toBe(
        'Địa chỉ email hoặc mật khẩu không chính xác.',
      )
      expect(formatAuthError(null, 'Lỗi mặc định')).toBe('Lỗi mặc định')
    })
  })

  describe('LoginForm component', () => {
    it('renders login fields and toggles password visibility', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>,
      )

      const emailInput = screen.getByLabelText(/Địa chỉ Email/i)
      const passwordInput = screen.getByLabelText(/^Mật khẩu$/i)

      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleBtn = screen.getByRole('button', { name: /Hiện mật khẩu/i })
      fireEvent.click(toggleBtn)

      expect(passwordInput).toHaveAttribute('type', 'text')
    })

    it('submits credentials and calls login on success', async () => {
      const mockSuccess = vi.fn()
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        user: {
          id: 'u-1',
          email: 'user@example.com',
          fullName: 'Nguyễn Văn A',
          phoneNumber: null,
          role: 'User',
        },
        message: 'Login successful.',
      })

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginForm onSuccess={mockSuccess} />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), {
        target: { value: 'user@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
        target: { value: 'Password123!' },
      })

      fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }))

      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalled()
      })
    })

    it('displays error alert when login fails', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Invalid email or password.'),
      )

      render(
        <MemoryRouter>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), {
        target: { value: 'wrong@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
        target: { value: 'WrongPass!' },
      })

      fireEvent.click(screen.getByRole('button', { name: /^Đăng nhập$/i }))

      await waitFor(() => {
        expect(
          screen.getByText('Địa chỉ email hoặc mật khẩu không chính xác.'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('RegisterForm component', () => {
    it('validates password requirements and mismatch', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterForm />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
        target: { value: 'Nguyễn Văn A' },
      })
      fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), {
        target: { value: 'user@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
        target: { value: 'short' },
      })
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), {
        target: { value: 'different' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục \(Nhận mã OTP\)/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật/i),
        ).toBeInTheDocument()
      })
    })

    it('validates phone number regex if provided', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterForm />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
        target: { value: 'Nguyễn Văn A' },
      })
      fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), {
        target: { value: 'user@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
        target: { value: 'invalid-phone' },
      })
      fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
        target: { value: 'StrongPass123!' },
      })
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), {
        target: { value: 'StrongPass123!' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục \(Nhận mã OTP\)/i }))

      await waitFor(() => {
        expect(screen.getByText(/Số điện thoại không hợp lệ/i)).toBeInTheDocument()
      })
    })

    it('advances to OTP step when info is valid and backend returns success', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        message: 'Mã xác thực OTP đã được gửi.',
        expirationMinutes: 10,
      })

      render(
        <MemoryRouter>
          <AuthProvider>
            <RegisterForm />
          </AuthProvider>
        </MemoryRouter>,
      )

      fireEvent.change(screen.getByLabelText(/Họ và tên/i), {
        target: { value: 'Nguyễn Văn A' },
      })
      fireEvent.change(screen.getByLabelText(/Địa chỉ Email/i), {
        target: { value: 'user@example.com' },
      })
      fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
        target: { value: '0912345678' },
      })
      fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
        target: { value: 'StrongPass123!' },
      })
      fireEvent.change(screen.getByLabelText(/Xác nhận mật khẩu/i), {
        target: { value: 'StrongPass123!' },
      })

      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục \(Nhận mã OTP\)/i }))

      await waitFor(() => {
        expect(screen.getByText('Nhập mã xác thực OTP')).toBeInTheDocument()
        expect(screen.getByText(/user@example.com/i)).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /Xác nhận & Hoàn tất/i }),
        ).toBeInTheDocument()
      })
    })
  })

  describe('AuthProvider', () => {
    function TestConsumer() {
      const { user, isAuthenticated, logout } = useAuth()
      return (
        <div>
          <span data-testid="auth-status">
            {isAuthenticated ? 'logged-in' : 'anonymous'}
          </span>
          <span data-testid="user-email">{user?.email ?? ''}</span>
          <button type="button" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      )
    }

    it('initializes from localStorage and clears on unauthorized event', async () => {
      localStorage.setItem(
        'tillegal_user_profile',
        JSON.stringify({
          id: 'u-saved',
          email: 'saved@example.com',
          fullName: 'Saved User',
          role: 'User',
        }),
      )

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      )

      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in')
      expect(screen.getByTestId('user-email')).toHaveTextContent('saved@example.com')

      // Simulate unauthorized event inside act
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('anonymous')
        expect(localStorage.getItem('tillegal_user_profile')).toBeNull()
      })
    })
  })
})
