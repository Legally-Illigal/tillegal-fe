import { useState, useEffect, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../hooks/use-auth'
import { formatAuthError } from '../utils/auth-error-helper'
import { GoogleAuthButton } from './google-auth-button'
import { toast } from 'sonner'

interface LoginFormProps {
  initialEmail?: string
  initialMessage?: string
  onSuccess?: () => void
}

export function LoginForm({
  initialEmail = '',
  initialMessage,
  onSuccess,
}: LoginFormProps) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const explicitFrom = (location.state as { from?: { pathname: string } })?.from?.pathname
  const from = explicitFrom || '/chat'

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(initialMessage ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  useEffect(() => {
    if (initialMessage) {
      setInfoMessage(initialMessage)
    }
  }, [initialMessage])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Vui lòng nhập đầy đủ địa chỉ email và mật khẩu.')
      return
    }

    setIsSubmitting(true)
    try {
      const profile = await login({ email: trimmedEmail, password })
      toast.success('Đăng nhập thành công!')
      if (onSuccess) {
        onSuccess()
      } else {
        const defaultTarget = profile.role?.toLowerCase() === 'admin' ? '/admin' : '/chat'
        navigate(explicitFrom || defaultTarget, { replace: true })
      }
    } catch (err) {
      setError(
        formatAuthError(
          err,
          'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOAuthSuccess = () => {
    if (onSuccess) {
      onSuccess()
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="space-y-4">
      {infoMessage && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          <AlertDescription className="text-xs">{infoMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-xs font-medium">
            Địa chỉ Email
          </Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="login-email"
              type="email"
              placeholder="lawyer@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              className="pl-8"
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-xs font-medium">
              Mật khẩu
            </Label>
          </div>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              className="pr-9 pl-8"
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-4 flex items-center justify-center">
        <div className="border-border w-full border-t" />
        <span className="bg-card text-muted-foreground px-2 text-[11px] uppercase">
          hoặc
        </span>
      </div>

      <GoogleAuthButton
        mode="login"
        onSuccess={handleOAuthSuccess}
        disabled={isSubmitting}
      />
    </div>
  )
}
