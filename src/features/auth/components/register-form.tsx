import { useState, useEffect, type FormEvent } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RotateCw,
  User,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useAuth } from '../hooks/use-auth'
import { authApi } from '../api/auth-api'
import { formatAuthError } from '../utils/auth-error-helper'
import { GoogleAuthButton } from './google-auth-button'

interface RegisterFormProps {
  onSuccess?: () => void
  onVerifiedButNeedsLogin?: (email: string) => void
}

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_SECONDS = 60

export function RegisterForm({ onSuccess, onVerifiedButNeedsLogin }: RegisterFormProps) {
  const { register, verifyRegistration } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || '/chat'

  // Step 1: 'info', Step 2: 'otp'
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // OTP timers
  const [cooldown, setCooldown] = useState(0)
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)
  const [timeLeftText, setTimeLeftText] = useState('')

  // Password rules validation
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const isMatched = password.length > 0 && password === confirmPassword

  // Countdown timer effect for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  // Countdown timer effect for OTP expiry
  useEffect(() => {
    if (!otpExpiresAt || step !== 'otp') return

    const updateTimer = () => {
      const remainingSeconds = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000))
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = remainingSeconds % 60
      setTimeLeftText(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [otpExpiresAt, step])

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const trimmedFullName = fullName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phoneNumber.trim()

    if (!trimmedFullName || !trimmedEmail || !password) {
      setError('Vui lòng điền đầy đủ họ và tên, email và mật khẩu.')
      return
    }

    if (trimmedFullName.length > 150) {
      setError('Họ và tên không được vượt quá 150 ký tự.')
      return
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Địa chỉ email không đúng định dạng.')
      return
    }

    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      setError(
        'Số điện thoại không hợp lệ (từ 7 đến 20 số, có thể kèm dấu + hoặc gạch nối).',
      )
      return
    }

    if (!hasLength || !hasUpper || !hasLower || !hasNumber) {
      setError('Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật.')
      return
    }

    if (!isMatched) {
      setError('Mật khẩu xác nhận không trùng khớp.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await register({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
        phoneNumber: trimmedPhone || undefined,
      })

      const expirationMinutes = res.expirationMinutes || 10
      setOtpExpiresAt(Date.now() + expirationMinutes * 60 * 1000)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setMessage(
        res.message ||
          `Mã xác thực OTP đã được gửi đến email ${trimmedEmail}. Vui lòng kiểm tra hộp thư đến hoặc thư rác.`,
      )
      setStep('otp')
    } catch (err) {
      setError(
        formatAuthError(
          err,
          'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtpSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    setError(null)
    setMessage(null)

    const trimmedOtp = otp.trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số mã OTP.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await verifyRegistration(
        { email: email.trim().toLowerCase(), otp: trimmedOtp },
        password,
      )

      if (result.autoLoggedIn) {
        toast.success('Đăng ký và đăng nhập thành công!')
        if (onSuccess) {
          onSuccess()
        } else {
          navigate(from, { replace: true })
        }
      } else {
        toast.success('Tài khoản đã kích hoạt thành công!')
        if (onVerifiedButNeedsLogin) {
          onVerifiedButNeedsLogin(email.trim().toLowerCase())
        } else if (onSuccess) {
          onSuccess()
        } else {
          navigate('/login', {
            state: {
              initialEmail: email.trim().toLowerCase(),
              infoMessage:
                'Tài khoản của bạn đã được kích hoạt thành công! Vui lòng đăng nhập.',
            },
            replace: true,
          })
        }
      }
    } catch (err) {
      setError(
        formatAuthError(
          err,
          'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return

    setError(null)
    setMessage(null)
    setIsResending(true)
    try {
      const trimmedEmail = email.trim().toLowerCase()
      const res = await authApi.resendOtp({ email: trimmedEmail })
      const expirationMinutes = res.expirationMinutes || 10
      setOtpExpiresAt(Date.now() + expirationMinutes * 60 * 1000)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setMessage(
        res.message ||
          'Mã OTP mới đã được gửi vào hòm thư của bạn. Vui lòng kiểm tra email.',
      )
      toast.success('Đã gửi lại mã xác thực OTP.')
    } catch (err) {
      setError(formatAuthError(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'))
    } finally {
      setIsResending(false)
    }
  }

  const handleOAuthSuccess = () => {
    if (onSuccess) {
      onSuccess()
    } else {
      navigate(from, { replace: true })
    }
  }

  // --- STEP 2: OTP VERIFICATION ---
  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
        {message && (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-4" />
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-10 items-center justify-center rounded-full">
            <KeyRound className="size-5" />
          </div>
          <div>
            <Label className="text-sm font-semibold">Nhập mã xác thực OTP</Label>
            <p className="text-muted-foreground mt-1 text-xs">
              Mã xác thực gồm 6 chữ số đã được gửi tới địa chỉ:
              <br />
              <strong className="text-foreground">{email}</strong>
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => {
                setOtp(val)
                if (error) setError(null)
              }}
              disabled={isSubmitting}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot
                  index={0}
                  className="size-11 rounded-md border text-base font-bold shadow-xs"
                />
                <InputOTPSlot
                  index={1}
                  className="size-11 rounded-md border text-base font-bold shadow-xs"
                />
                <InputOTPSlot
                  index={2}
                  className="size-11 rounded-md border text-base font-bold shadow-xs"
                />
                <InputOTPSlot
                  index={3}
                  className="size-11 rounded-md border text-base font-bold shadow-xs"
                />
                <InputOTPSlot
                  index={4}
                  className="size-11 rounded-md border text-base font-bold shadow-xs"
                />
                <InputOTPSlot
                  index={5}
                  className="size-11 rounded-md border text-base font-bold shadow-xs"
                />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {timeLeftText && (
            <p className="text-muted-foreground text-[11px]">
              Mã hết hiệu lực sau:{' '}
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                {timeLeftText}
              </span>
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full gap-2 font-medium"
          disabled={isSubmitting || otp.length !== 6}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Đang kiểm tra...</span>
            </>
          ) : (
            <>
              <span>Xác nhận & Hoàn tất</span>
              <CheckCircle2 className="size-4" />
            </>
          )}
        </Button>

        <div className="flex items-center justify-between border-t pt-3 text-xs">
          <button
            type="button"
            onClick={() => {
              setStep('info')
              setError(null)
              setMessage(null)
            }}
            className="text-muted-foreground hover:text-foreground text-[11px] underline underline-offset-2"
          >
            Quay lại sửa thông tin
          </button>

          <button
            type="button"
            onClick={() => void handleResendOtp()}
            disabled={cooldown > 0 || isResending}
            className="text-primary flex items-center gap-1 text-[11px] font-medium hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            <RotateCw className={`size-3 ${isResending ? 'animate-spin' : ''}`} />
            <span>{cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : 'Gửi lại mã OTP'}</span>
          </button>
        </div>
      </form>
    )
  }

  // --- STEP 1: ACCOUNT INFORMATION ---
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="reg-fullname" className="text-xs font-medium">
            Họ và tên
          </Label>
          <div className="relative">
            <User className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="reg-fullname"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (error) setError(null)
              }}
              className="pl-8"
              disabled={isSubmitting}
              autoComplete="name"
              maxLength={150}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-xs font-medium">
            Địa chỉ Email
          </Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="reg-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (error) setError(null)
              }}
              className="pl-8"
              disabled={isSubmitting}
              autoComplete="email"
              maxLength={255}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-phone" className="text-xs font-medium">
            Số điện thoại{' '}
            <span className="text-muted-foreground font-normal">(tùy chọn)</span>
          </Label>
          <div className="relative">
            <Phone className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="reg-phone"
              type="tel"
              placeholder="0912345678"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value)
                if (error) setError(null)
              }}
              className="pl-8"
              disabled={isSubmitting}
              autoComplete="tel"
              maxLength={20}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-password" className="text-xs font-medium">
            Mật khẩu
          </Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (error) setError(null)
              }}
              className="pr-9 pl-8"
              disabled={isSubmitting}
              autoComplete="new-password"
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

        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm-password" className="text-xs font-medium">
            Xác nhận mật khẩu
          </Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (error) setError(null)
              }}
              className="pr-9 pl-8"
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 transition-colors"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Real-time Password Requirements Checklist */}
        <div className="bg-muted/40 space-y-1 rounded-lg border p-2.5 text-[11px]">
          <p className="text-muted-foreground mb-1 font-semibold">Tiêu chuẩn mật khẩu:</p>
          <div className="text-muted-foreground grid grid-cols-2 gap-1">
            <div
              className={`flex items-center gap-1.5 ${hasLength ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}
            >
              {hasLength ? <Check className="size-3" /> : <Circle className="size-3" />}
              <span>Tối thiểu 8 ký tự</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}
            >
              {hasUpper && hasLower ? (
                <Check className="size-3" />
              ) : (
                <Circle className="size-3" />
              )}
              <span>Chữ hoa & thường</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${hasNumber ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}
            >
              {hasNumber ? <Check className="size-3" /> : <Circle className="size-3" />}
              <span>Ít nhất 1 số (0-9)</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${isMatched ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}
            >
              {isMatched ? <Check className="size-3" /> : <Circle className="size-3" />}
              <span>Khớp xác nhận</span>
            </div>
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
              <span>Đang gửi mã xác thực...</span>
            </>
          ) : (
            <>
              <span>Tiếp tục (Nhận mã OTP)</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-3 flex items-center justify-center">
        <div className="border-border w-full border-t" />
        <span className="bg-card text-muted-foreground px-2 text-[11px] uppercase">
          hoặc
        </span>
      </div>

      <GoogleAuthButton
        mode="register"
        onSuccess={handleOAuthSuccess}
        disabled={isSubmitting}
      />
    </div>
  )
}
