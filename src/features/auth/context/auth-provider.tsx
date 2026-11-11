import { useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth-api'
import { tokenStorage } from '@/lib/api'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved) as UserProfile
      } catch {
        return null
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const handleUnauthorized = () => {
      tokenStorage.clearTokens()
      localStorage.removeItem(USER_STORAGE_KEY)
      setUser(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true)
    try {
      const response = await authApi.login({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      })
      const profile: UserProfile = response.user
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
      setUser(profile)
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
          const profile: UserProfile = loginResponse.user
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
      const profile: UserProfile = {
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        role: 'User',
      }
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

  const logout = () => {
    tokenStorage.clearTokens()
    localStorage.removeItem(USER_STORAGE_KEY)
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
