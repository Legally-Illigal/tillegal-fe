import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { authApi } from '../api/auth-api'
import { chatApi } from '@/features/chat/api/chat-api'
import { ApiError, tokenStorage } from '@/lib/api'
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UserProfile,
  VerifyRegistrationRequest,
  VerifyRegistrationResult,
} from '../types/auth.types'
import { AuthContext } from './auth-context'

const USER_STORAGE_KEY = 'tillegal_user_profile'

function normalizeUserProfile(raw: UserProfile): UserProfile {
  return {
    ...raw,
    id: String(raw.id).toLowerCase(),
    email: raw.email.toLowerCase(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile
        return parsed && parsed.id ? normalizeUserProfile(parsed) : null
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    const handleSessionMismatch = () => {
      tokenStorage.clearTokens()
      localStorage.removeItem(USER_STORAGE_KEY)
      chatApi.clearLocalConversations()
      setUser(null)
      toast.error(
        'Phát hiện phiên đăng nhập không trùng khớp trên trình duyệt. Để bảo đảm an toàn dữ liệu, hệ thống đã tự động đăng xuất.',
        { duration: 6000 },
      )
    }

    const handleUnauthorized = () => {
      tokenStorage.clearTokens()
      localStorage.removeItem(USER_STORAGE_KEY)
      chatApi.clearLocalConversations()
      setUser(null)
    }

    window.addEventListener('auth:session-mismatch', handleSessionMismatch)
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:session-mismatch', handleSessionMismatch)
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  // Đồng bộ phiên người dùng qua nhiều tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_STORAGE_KEY) {
        if (!e.newValue) {
          setUser(null)
          chatApi.clearLocalConversations()
        } else {
          try {
            const nextProfile = JSON.parse(e.newValue) as UserProfile
            if (nextProfile && nextProfile.id) {
              const normalized = normalizeUserProfile(nextProfile)
              if (normalized.id !== user?.id) {
                setUser(normalized)
              }
            }
          } catch {
            setUser(null)
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [user?.id])

  // Chủ động kiểm tra tính hợp lệ của phiên đăng nhập với máy chủ qua GET /api/auth/me
  useEffect(() => {
    let lastCheck = 0

    const verifySessionWithServer = async () => {
      const now = Date.now()
      if (now - lastCheck < 3000) return
      lastCheck = now

      try {
        const me = await authApi.getMe({ silent401: true })
        const serverUser: UserProfile = normalizeUserProfile({
          id: me.id,
          fullName: me.fullName,
          email: me.email || '',
          phoneNumber: me.phoneNumber,
          role: me.role,
        })

        if (!me.isActive) {
          tokenStorage.clearTokens()
          localStorage.removeItem(USER_STORAGE_KEY)
          chatApi.clearLocalConversations()
          setUser(null)
          toast.error(
            'Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa bởi quản trị viên.',
          )
          return
        }

        // Kiểm tra mismatch session giữa client và cookie máy chủ
        const currentUser = userRef.current
        if (
          currentUser?.id &&
          currentUser.id.toLowerCase() !== serverUser.id.toLowerCase()
        ) {
          window.dispatchEvent(
            new CustomEvent('auth:session-mismatch', {
              detail: {
                expectedUserId: currentUser.id,
                actualUserId: serverUser.id,
              },
            }),
          )
          return
        }

        // Đồng bộ dữ liệu người dùng mới nhất từ máy chủ
        if (
          !currentUser ||
          currentUser.id.toLowerCase() !== serverUser.id.toLowerCase() ||
          currentUser.fullName !== serverUser.fullName ||
          currentUser.role !== serverUser.role ||
          currentUser.email !== serverUser.email
        ) {
          setUser(serverUser)
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(serverUser))
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          if (userRef.current) {
            tokenStorage.clearTokens()
            localStorage.removeItem(USER_STORAGE_KEY)
            chatApi.clearLocalConversations()
            setUser(null)
          }
        }
      }
    }

    void verifySessionWithServer()

    const handleWindowFocus = () => {
      if (document.visibilityState === 'visible') {
        void verifySessionWithServer()
      }
    }

    window.addEventListener('visibilitychange', handleWindowFocus)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('visibilitychange', handleWindowFocus)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  const login = async (credentials: LoginRequest): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const response = await authApi.login({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })
      if (response.accessToken) {
        tokenStorage.setAccessToken(response.accessToken)
      }
      const profile: UserProfile = normalizeUserProfile(response.user)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
      setUser(profile)
      return profile
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterRequest): Promise<RegisterResponse> => {
    setIsLoading(true)
    try {
      return await authApi.register({
        fullName: credentials.fullName.trim(),
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        phoneNumber: credentials.phoneNumber?.trim() || undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyRegistration = async (
    credentials: VerifyRegistrationRequest,
    autoLoginPassword?: string,
  ): Promise<VerifyRegistrationResult> => {
    setIsLoading(true)
    try {
      const normalizedEmail = credentials.email.trim().toLowerCase()
      const verifyRes = await authApi.verifyRegistration({
        email: normalizedEmail,
        otp: credentials.otp.trim(),
      })

      let autoLoggedIn = false
      if (autoLoginPassword) {
        try {
          const loginResponse = await authApi.login({
            email: normalizedEmail,
            password: autoLoginPassword,
          })
          if (loginResponse.accessToken) {
            tokenStorage.setAccessToken(loginResponse.accessToken)
          }
          const profile: UserProfile = normalizeUserProfile(loginResponse.user)
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
          setUser(profile)
          autoLoggedIn = true
        } catch {
          // Verification still succeeded even if auto-login had an issue
          autoLoggedIn = false
        }
      }

      return {
        verified: true,
        autoLoggedIn,
        email: verifyRes.email || normalizedEmail,
        fullName: verifyRes.fullName || '',
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async (idToken: string) => {
    setIsLoading(true)
    try {
      const response = await authApi.loginGoogle({ idToken })
      if (response.accessToken) {
        tokenStorage.setAccessToken(response.accessToken)
      }
      const profile: UserProfile = normalizeUserProfile({
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: 'User',
      })
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
      setUser(profile)
    } finally {
      setIsLoading(false)
    }
  }

  const registerWithGoogle = async (idToken: string) => {
    // Backend đã hợp nhất luồng Google Login: tự động đăng nhập hoặc tạo tài khoản mới nếu chưa có
    return loginWithGoogle(idToken)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Backend may not have implemented /auth/logout endpoint yet, fail silently
    }
    tokenStorage.clearTokens()
    localStorage.removeItem(USER_STORAGE_KEY)
    chatApi.clearLocalConversations()
    setUser(null)
    window.location.href = '/'
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    verifyRegistration,
    loginWithGoogle,
    registerWithGoogle,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
