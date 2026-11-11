import { createContext } from 'react'
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyRegistrationRequest,
  VerifyRegistrationResult,
} from '../types/auth.types'

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  register: (credentials: RegisterRequest) => Promise<RegisterResponse>
  verifyRegistration: (
    credentials: VerifyRegistrationRequest,
    autoLoginPassword?: string,
  ) => Promise<VerifyRegistrationResult>
  loginWithGoogle: (idToken: string) => Promise<void>
  registerWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
