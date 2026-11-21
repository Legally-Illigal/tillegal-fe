import { useEffect, useState, type FormEvent } from 'react'
import {
  Calendar,
  Check,
  Clock,
  Loader2,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  Shield,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import type { UserProfileResponse } from '../types/user.types'
import { formatUserDateTime, getUserRoleLabel } from '../utils/user-formatters'

interface ProfileInfoFormProps {
  profile: UserProfileResponse
  isUpdating: boolean
  onUpdate: (fullName: string, phoneNumber?: string | null) => Promise<boolean>
}

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/

export function ProfileInfoForm({ profile, isUpdating, onUpdate }: ProfileInfoFormProps) {
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '')
  const [errors, setErrors] = useState<{ fullName?: string; phoneNumber?: string }>({})

  useEffect(() => {
    setFullName(profile.fullName || '')
    setPhoneNumber(profile.phoneNumber || '')
  }, [profile])

  const hasChanges =
    fullName.trim() !== (profile.fullName || '').trim() ||
    (phoneNumber.trim() || '') !== (profile.phoneNumber || '').trim()

  const validate = (): boolean => {
    const nextErrors: { fullName?: string; phoneNumber?: string } = {}
    const trimmedName = fullName.trim()

    if (!trimmedName) {
      nextErrors.fullName = 'Vui lòng nhập họ và tên.'
    } else if (trimmedName.length > 150) {
      nextErrors.fullName = 'Họ và tên không được vượt quá 150 ký tự.'
    }

    const trimmedPhone = phoneNumber.trim()
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      nextErrors.phoneNumber = 'Số điện thoại không đúng định dạng (7-20 chữ số).'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onUpdate(fullName.trim(), phoneNumber.trim() || null)
  }

  const handleReset = () => {
    setFullName(profile.fullName || '')
    setPhoneNumber(profile.phoneNumber || '')
    setErrors({})
  }

  const roleLabel = getUserRoleLabel(profile.role)
  const isLawyer = profile.role?.toLowerCase() === 'lawyer'
  const isAdmin = profile.role?.toLowerCase() === 'admin'

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Hồ sơ người dùng</CardTitle>
            <CardDescription>
              Xem và cập nhật thông tin định danh cá nhân của bạn trên Tillegal.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant={isAdmin ? 'default' : isLawyer ? 'secondary' : 'outline'}
              className="gap-1 px-2.5 py-0.5 text-xs font-semibold"
            >
              <Shield className="size-3" />
              <span>{roleLabel}</span>
            </Badge>
            <Badge
              variant={profile.isActive ? 'outline' : 'destructive'}
              className={
                profile.isActive
                  ? 'border-emerald-500/40 text-xs text-emerald-600 dark:text-emerald-400'
                  : 'text-xs'
              }
            >
              {profile.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Readonly info: Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-email"
              className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium"
            >
              <Mail className="size-3.5" />
              <span>Địa chỉ email</span>
            </Label>
            <div className="relative">
              <Input
                id="profile-email"
                type="email"
                value={profile.email || 'Chưa cung cấp'}
                disabled
                className="bg-muted/50 cursor-not-allowed pl-8 text-sm"
              />
              <Lock className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground text-[11px]">
              Email dùng để xác thực và nhận thông báo, không thể thay đổi.
            </p>
          </div>

          {/* Editable: Full Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-fullname"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <User className="text-primary size-3.5" />
              <span>
                Họ và tên <span className="text-destructive">*</span>
              </span>
            </Label>
            <Input
              id="profile-fullname"
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              maxLength={150}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName)
                  setErrors((prev) => ({ ...prev, fullName: undefined }))
              }}
              disabled={isUpdating}
              aria-invalid={Boolean(errors.fullName)}
              className={
                errors.fullName ? 'border-destructive focus-visible:ring-destructive' : ''
              }
            />
            {errors.fullName && (
              <p className="text-destructive text-[11px] font-medium">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Editable: Phone Number */}
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-phone"
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              <Phone className="text-primary size-3.5" />
              <span>Số điện thoại liên hệ</span>
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              placeholder="0912345678 hoặc +84912345678"
              value={phoneNumber}
              maxLength={20}
              onChange={(e) => {
                setPhoneNumber(e.target.value)
                if (errors.phoneNumber)
                  setErrors((prev) => ({ ...prev, phoneNumber: undefined }))
              }}
              disabled={isUpdating}
              aria-invalid={Boolean(errors.phoneNumber)}
              className={
                errors.phoneNumber
                  ? 'border-destructive focus-visible:ring-destructive'
                  : ''
              }
            />
            {errors.phoneNumber && (
              <p className="text-destructive text-[11px] font-medium">
                {errors.phoneNumber}
              </p>
            )}
            <p className="text-muted-foreground text-[11px]">
              Tùy chọn. Dùng để đối chiếu và hỗ trợ liên hệ khi tư vấn hồ sơ.
            </p>
          </div>

          {/* Metadata: CreatedAt & LastActiveAt */}
          <div className="border-border/40 grid grid-cols-1 gap-3 border-t pt-2 sm:grid-cols-2">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Calendar className="text-muted-foreground size-3.5" />
              <span>Ngày tham gia:</span>
              <span className="text-foreground font-medium">
                {formatUserDateTime(profile.createdAt)}
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <Clock className="text-muted-foreground size-3.5" />
              <span>Hoạt động gần nhất:</span>
              <span className="text-foreground font-medium">
                {formatUserDateTime(profile.lastActiveAt)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-border/40 flex items-center justify-between border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || isUpdating}
            className="text-muted-foreground text-xs"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            <span>Đặt lại</span>
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={!hasChanges || isUpdating}
            className="min-w-28 text-xs font-semibold"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="mr-1.5 size-3.5" />
                <span>Lưu thay đổi</span>
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
