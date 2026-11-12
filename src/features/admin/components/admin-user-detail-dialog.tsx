import { Loader2, Mail, Phone, Shield, UserCheck, UserX } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { AdminUser } from '../types/admin.types'
import {
  formatAdminDateTime,
  getRoleBadgeVariant,
  getRoleDisplayLabel,
  getUserInitials,
} from '../utils/admin-formatters'

interface AdminUserDetailDialogProps {
  user: AdminUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  isSelf: boolean
  isMutating: boolean
  onRequestToggleStatus: (user: AdminUser) => void
  onRequestGrantLawyer: (user: AdminUser) => void
}

export function AdminUserDetailDialog({
  user,
  open,
  onOpenChange,
  isLoading,
  isSelf,
  isMutating,
  onRequestToggleStatus,
  onRequestGrantLawyer,
}: AdminUserDetailDialogProps) {
  const roleLower = user?.roleName?.toLowerCase()
  const canGrantLawyer = Boolean(user && roleLower !== 'lawyer' && roleLower !== 'admin')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thông tin tài khoản</DialogTitle>
          <DialogDescription>
            Chi tiết hồ sơ, vai trò và trạng thái hoạt động của người dùng.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="bg-primary/10 text-primary size-12 text-sm font-semibold">
                <AvatarFallback>
                  {getUserInitials(user.fullName, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-semibold">
                    {user.fullName || 'Chưa cập nhật tên'}
                  </p>
                  <Badge variant={getRoleBadgeVariant(user.roleName)}>
                    {getRoleDisplayLabel(user.roleName)}
                  </Badge>
                  <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
                    {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  ID: <span className="font-mono">{user.id}</span>
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Mail className="size-3.5" />
                  <span>Email</span>
                </p>
                <p className="font-medium break-all">{user.email || 'Chưa có'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Phone className="size-3.5" />
                  <span>Số điện thoại</span>
                </p>
                <p className="font-medium">{user.phoneNumber || 'Chưa cập nhật'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Ngày tạo tài khoản</p>
                <p className="font-medium">{formatAdminDateTime(user.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Hoạt động gần nhất</p>
                <p className="font-medium">{formatAdminDateTime(user.lastActiveAt)}</p>
              </div>
            </div>

            {isLoading && (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang đồng bộ thông tin mới nhất...</span>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex-wrap gap-2">
          {user && canGrantLawyer && (
            <Button
              type="button"
              variant="secondary"
              disabled={isMutating}
              onClick={() => onRequestGrantLawyer(user)}
            >
              <Shield className="mr-1.5 size-4" />
              Cấp quyền Luật sư
            </Button>
          )}
          {user && !isSelf && (
            <Button
              type="button"
              variant={user.isActive ? 'destructive' : 'default'}
              disabled={isMutating}
              onClick={() => onRequestToggleStatus(user)}
            >
              {user.isActive ? (
                <>
                  <UserX className="mr-1.5 size-4" />
                  Khóa tài khoản
                </>
              ) : (
                <>
                  <UserCheck className="mr-1.5 size-4" />
                  Mở khóa tài khoản
                </>
              )}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
