import { useState, type FormEvent } from 'react'
import { Check, Eye, EyeOff, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ChangePasswordFormProps {
  isChangingPassword: boolean
  onChangePassword: (newPassword: string, confirmPassword: string) => Promise<boolean>
}

export function ChangePasswordForm({
  isChangingPassword,
  onChangePassword,
}: ChangePasswordFormProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<{
    newPassword?: string
    confirmPassword?: string
  }>({})

  const rules = [
    { label: 'Tối thiểu 8 ký tự', passed: newPassword.length >= 8 },
    { label: 'Ít nhất một chữ in hoa (A-Z)', passed: /[A-Z]/.test(newPassword) },
    { label: 'Ít nhất một chữ cái thường (a-z)', passed: /[a-z]/.test(newPassword) },
    { label: 'Ít nhất một chữ số (0-9)', passed: /[0-9]/.test(newPassword) },
    {
      label: 'Mật khẩu xác nhận trùng khớp',
      passed: Boolean(newPassword && confirmPassword && newPassword === confirmPassword),
    },
  ]

  const isAllValid = rules.every((r) => r.passed)

  const validate = (): boolean => {
    const nextErrors: { newPassword?: string; confirmPassword?: string } = {}

    if (!newPassword) {
      nextErrors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.'
    } else if (!/[A-Z]/.test(newPassword)) {
      nextErrors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ in hoa (A-Z).'
    } else if (!/[a-z]/.test(newPassword)) {
      nextErrors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ thường (a-z).'
    } else if (!/[0-9]/.test(newPassword)) {
      nextErrors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).'
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const success = await onChangePassword(newPassword, confirmPassword)
    if (success) {
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
    }
  }

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <KeyRound className="size-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Đổi mật khẩu</CardTitle>
            <CardDescription>
              Cập nhật mật khẩu để bảo vệ an toàn cho tài khoản và lịch sử tư vấn của bạn.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-medium">
              Mật khẩu mới <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword)
                    setErrors((prev) => ({ ...prev, newPassword: undefined }))
                }}
                disabled={isChangingPassword}
                aria-invalid={Boolean(errors.newPassword)}
                className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-destructive text-[11px] font-medium">
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password" className="text-xs font-medium">
              Xác nhận mật khẩu mới <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirm-new-password"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                  }
                }}
                disabled={isChangingPassword}
                aria-invalid={Boolean(errors.confirmPassword)}
                className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-[11px] font-medium">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Password requirement checklist */}
          <div className="border-border/40 bg-muted/30 space-y-1.5 rounded-lg border p-3">
            <p className="text-foreground flex items-center gap-1.5 text-xs font-medium">
              <ShieldCheck className="text-primary size-3.5" />
              <span>Tiêu chuẩn bảo mật mật khẩu:</span>
            </p>
            <div className="grid grid-cols-1 gap-1 text-[11px] sm:grid-cols-2">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 transition-colors ${
                    rule.passed
                      ? 'font-medium text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {rule.passed ? (
                    <Check className="size-3 shrink-0" />
                  ) : (
                    <X className="size-3 shrink-0 opacity-40" />
                  )}
                  <span>{rule.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-border/40 flex items-center justify-end border-t pt-4">
          <Button
            type="submit"
            size="sm"
            disabled={!isAllValid || isChangingPassword}
            className="min-w-36 text-xs font-semibold"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <KeyRound className="mr-1.5 size-3.5" />
                <span>Cập nhật mật khẩu</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
