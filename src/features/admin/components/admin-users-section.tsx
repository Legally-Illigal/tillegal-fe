import * as React from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@/features/auth'
import { useAdminUsers } from '../hooks/use-admin-users'
import type { AdminUser } from '../types/admin.types'
import {
  formatAdminDateTime,
  getRoleBadgeVariant,
  getRoleDisplayLabel,
  getUserInitials,
} from '../utils/admin-formatters'
import { AdminConfirmDialog } from './admin-confirm-dialog'
import { AdminUserDetailDialog } from './admin-user-detail-dialog'

type PendingAction =
  | { type: 'toggle-status'; user: AdminUser }
  | { type: 'grant-lawyer'; user: AdminUser }
  | null

export function AdminUsersSection() {
  const { user: currentUser } = useAuth()
  const {
    users,
    totalCount,
    pageNumber,
    totalPages,
    searchTerm,
    setSearchTerm,
    setPageNumber,
    isLoading,
    error,
    mutatingUserId,
    selectedUser,
    isDetailOpen,
    isDetailLoading,
    setIsDetailOpen,
    refresh,
    openUserDetail,
    toggleUserStatus,
    grantLawyerRole,
  } = useAdminUsers()

  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null)

  const handleConfirmAction = async () => {
    if (!pendingAction) return
    let succeeded = false

    if (pendingAction.type === 'toggle-status') {
      succeeded = await toggleUserStatus(pendingAction.user)
    } else if (pendingAction.type === 'grant-lawyer') {
      succeeded = await grantLawyerRole(pendingAction.user)
    }

    if (succeeded) {
      setPendingAction(null)
    }
  }

  const isActionPending = Boolean(
    pendingAction && mutatingUserId === pendingAction.user.id,
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Danh sách tài khoản hệ thống</CardTitle>
            <CardDescription>
              Tìm kiếm người dùng, cấp quyền Luật sư và quản lý trạng thái khóa/mở tài
              khoản.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Tổng: {totalCount} tài khoản</Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Toolbar */}
          <div className="relative max-w-md">
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
            <Input
              aria-label="Tìm kiếm người dùng"
              placeholder="Tìm theo họ tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-8"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => setSearchTerm('')}
                className="text-muted-foreground hover:text-foreground absolute top-2.5 right-2.5 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>{error}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refresh()}
                >
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hoạt động gần nhất</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-10 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground h-24 text-center"
                    >
                      {searchTerm.trim()
                        ? `Không tìm thấy người dùng nào khớp với "${searchTerm.trim()}".`
                        : 'Chưa có tài khoản người dùng nào trong hệ thống.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((item) => {
                    const isSelf = currentUser?.id === item.id
                    const roleLower = item.roleName?.toLowerCase()
                    const canGrantLawyer = roleLower !== 'lawyer' && roleLower !== 'admin'
                    const isRowMutating = mutatingUserId === item.id

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              size="sm"
                              className="bg-primary/10 text-primary text-xs font-semibold"
                            >
                              <AvatarFallback>
                                {getUserInitials(item.fullName, item.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-medium">
                                  {item.fullName || 'Chưa cập nhật tên'}
                                </span>
                                {isSelf && (
                                  <Badge
                                    variant="outline"
                                    className="px-1.5 py-0 text-[10px]"
                                  >
                                    Bạn
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground truncate text-xs">
                                {item.email || '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.phoneNumber || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(item.roleName)}>
                            {getRoleDisplayLabel(item.roleName)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.isActive ? 'secondary' : 'destructive'}>
                            {item.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatAdminDateTime(item.lastActiveAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void openUserDetail(item)}
                            >
                              <Eye className="mr-1 size-3.5" />
                              Chi tiết
                            </Button>

                            {canGrantLawyer && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isRowMutating}
                                onClick={() =>
                                  setPendingAction({ type: 'grant-lawyer', user: item })
                                }
                              >
                                <Shield className="mr-1 size-3.5" />
                                Cấp Luật sư
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant={item.isActive ? 'destructive' : 'secondary'}
                              size="sm"
                              disabled={isSelf || isRowMutating}
                              title={
                                isSelf
                                  ? 'Không thể tự khóa tài khoản đang đăng nhập'
                                  : undefined
                              }
                              onClick={() =>
                                setPendingAction({ type: 'toggle-status', user: item })
                              }
                            >
                              {item.isActive ? (
                                <>
                                  <UserX className="mr-1 size-3.5" />
                                  Khóa
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-1 size-3.5" />
                                  Mở khóa
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              Trang <span className="text-foreground font-medium">{pageNumber}</span> /{' '}
              {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1 || isLoading}
                onClick={() => setPageNumber(pageNumber - 1)}
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber >= totalPages || isLoading}
                onClick={() => setPageNumber(pageNumber + 1)}
              >
                Sau
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminUserDetailDialog
        user={selectedUser}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        isLoading={isDetailLoading}
        isSelf={Boolean(selectedUser && currentUser?.id === selectedUser.id)}
        isMutating={Boolean(selectedUser && mutatingUserId === selectedUser.id)}
        onRequestToggleStatus={(target) =>
          setPendingAction({ type: 'toggle-status', user: target })
        }
        onRequestGrantLawyer={(target) =>
          setPendingAction({ type: 'grant-lawyer', user: target })
        }
      />

      <AdminConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open && !isActionPending) {
            setPendingAction(null)
          }
        }}
        title={
          pendingAction?.type === 'grant-lawyer'
            ? 'Xác nhận cấp quyền Luật sư'
            : pendingAction?.user.isActive
              ? 'Xác nhận khóa tài khoản'
              : 'Xác nhận mở khóa tài khoản'
        }
        description={
          pendingAction?.type === 'grant-lawyer'
            ? `Bạn có chắc muốn nâng cấp tài khoản "${pendingAction.user.fullName || pendingAction.user.email}" lên vai trò Luật sư không?`
            : pendingAction?.user.isActive
              ? `Tài khoản "${pendingAction.user.fullName || pendingAction.user.email}" sẽ không thể đăng nhập và sử dụng hệ thống cho đến khi được mở khóa.`
              : `Tài khoản "${pendingAction?.user.fullName || pendingAction?.user.email}" sẽ được kích hoạt trở lại và có thể đăng nhập bình thường.`
        }
        confirmLabel={
          pendingAction?.type === 'grant-lawyer'
            ? 'Cấp quyền Luật sư'
            : pendingAction?.user.isActive
              ? 'Khóa tài khoản'
              : 'Mở khóa'
        }
        confirmVariant={
          pendingAction?.type === 'toggle-status' && pendingAction.user.isActive
            ? 'destructive'
            : 'default'
        }
        isPending={isActionPending}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  )
}
