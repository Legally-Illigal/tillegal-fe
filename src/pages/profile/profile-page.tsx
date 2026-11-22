import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, KeyRound, Loader2, RefreshCw, Shield, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChangePasswordForm,
  DeactivateAccountCard,
  getUserRoleLabel,
  ProfileInfoForm,
  useUserProfile,
} from '@/features/user'

type ProfileTab = 'info' | 'security' | 'danger'

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
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
  } = useUserProfile()

  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'security' || tabParam === 'danger') return tabParam
    return 'info'
  })

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'security' || tabParam === 'danger') {
      setActiveTab(tabParam)
    } else {
      setActiveTab('info')
    }
  }, [searchParams])

  const handleTabChange = (nextTab: string) => {
    const tabValue: ProfileTab =
      nextTab === 'security' || nextTab === 'danger' ? nextTab : 'info'
    setActiveTab(tabValue)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tabValue)
        return next
      },
      { replace: true },
    )
  }

  const userInitials = profile?.fullName
    ? profile.fullName
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'TL'

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      {/* Header Profile Summary */}
      <div className="border-border/60 bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="border-primary/20 bg-primary/10 text-primary size-14 border-2 text-base font-bold">
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {profile?.fullName || 'Hồ sơ người dùng'}
              </h1>
              {profile && (
                <Badge
                  variant={
                    profile.role?.toLowerCase() === 'admin'
                      ? 'default'
                      : profile.role?.toLowerCase() === 'lawyer'
                        ? 'secondary'
                        : 'outline'
                  }
                  className="px-2 py-0 text-[10px] font-semibold"
                >
                  {getUserRoleLabel(profile.role)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {profile?.email ||
                'Quản lý thông tin tài khoản, bảo mật và mật khẩu của bạn.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchProfile()}
            disabled={isLoading}
            className="text-xs"
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !profile && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="text-primary mb-3 size-8 animate-spin" />
          <p className="text-foreground text-sm font-medium">
            Đang tải thông tin hồ sơ...
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Vui lòng chờ trong giây lát trong khi chúng tôi đồng bộ dữ liệu.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !profile && (
        <div className="border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center rounded-xl border p-6 py-12 text-center">
          <AlertCircle className="text-destructive mb-3 size-10" />
          <h2 className="text-foreground text-base font-semibold">
            Không thể tải thông tin hồ sơ
          </h2>
          <p className="text-muted-foreground mt-1 max-w-md text-xs">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void fetchProfile()}
            className="mt-4 gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* Content tabs */}
      {profile && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger value="info" className="gap-1.5 text-xs">
              <User className="size-3.5" />
              <span>Thông tin cá nhân</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs">
              <KeyRound className="size-3.5" />
              <span>Đổi mật khẩu</span>
            </TabsTrigger>
            <TabsTrigger
              value="danger"
              className="text-destructive data-[state=active]:text-destructive gap-1.5 text-xs"
            >
              <Shield className="size-3.5" />
              <span>Vô hiệu hóa</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-0 space-y-4">
            <ProfileInfoForm
              profile={profile}
              isUpdating={isUpdating}
              onUpdate={updateProfile}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-4">
            <ChangePasswordForm
              isChangingPassword={isChangingPassword}
              onChangePassword={changePassword}
            />
          </TabsContent>

          <TabsContent value="danger" className="mt-0 space-y-4">
            <DeactivateAccountCard
              profile={profile}
              isDeactivating={isDeactivating}
              onDeactivate={deactivateAccount}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
