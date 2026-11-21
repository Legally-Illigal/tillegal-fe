import { useState } from 'react'
import { AlertCircle, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UserProfileResponse } from '../types/user.types'

interface DeactivateAccountCardProps {
  profile: UserProfileResponse | null
  isDeactivating: boolean
  onDeactivate: () => Promise<boolean>
}

export function DeactivateAccountCard({
  profile,
  isDeactivating,
  onDeactivate,
}: DeactivateAccountCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isAdmin = profile?.role?.toLowerCase() === 'admin'

  const handleConfirmDeactivate = async () => {
    const success = await onDeactivate()
    if (success) {
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-destructive/10 text-destructive flex size-8 items-center justify-center rounded-lg">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <CardTitle className="text-destructive text-lg font-bold">
                Vùng nguy hiểm &amp; Vô hiệu hóa tài khoản
              </CardTitle>
              <CardDescription>
                Tạm thời vô hiệu hóa quyền truy cập và bảo vệ dữ liệu cá nhân của bạn.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isAdmin ? (
            <Alert
              variant="destructive"
              className="border-destructive/40 bg-background/80"
            >
              <ShieldAlert className="size-4" />
              <AlertTitle className="text-xs font-semibold">
                Giới hạn đặc quyền Quản trị
              </AlertTitle>
              <AlertDescription className="text-xs">
                Quản trị viên hệ thống (Admin) không thể tự vô hiệu hóa tài khoản của
                chính mình. Quy định này nhằm đảm bảo tính liên tục trong công tác vận
                hành và quản trị hệ thống.
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Sau khi vô hiệu hóa, tài khoản của bạn sẽ lập tức bị khóa và toàn bộ phiên
              đăng nhập trên các thiết bị sẽ kết thúc. Bạn sẽ không thể tiếp tục gửi câu
              hỏi pháp lý hoặc truy cập các đoạn hội thoại đã lưu cho đến khi tài khoản
              được kích hoạt lại bởi quản trị viên.
            </p>
          )}
        </CardContent>

        <CardFooter className="border-destructive/20 flex items-center justify-between border-t pt-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <AlertCircle className="text-destructive size-3.5 shrink-0" />
            <span>Hành động này sẽ đăng xuất tài khoản ngay lập tức.</span>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isAdmin || isDeactivating}
            onClick={() => setIsDialogOpen(true)}
            className="text-xs font-semibold shadow-xs"
          >
            {isDeactivating ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="mr-1.5 size-3.5" />
                <span>Vô hiệu hóa tài khoản</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex size-12 items-center justify-center rounded-full">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Xác nhận vô hiệu hóa tài khoản
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center text-xs leading-relaxed">
              Bạn có chắc chắn muốn vô hiệu hóa tài khoản{' '}
              <strong className="text-foreground">
                {profile?.email || profile?.fullName}
              </strong>
              ? Toàn bộ phiên làm việc sẽ kết thúc và bạn sẽ được chuyển hướng về trang
              chủ.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              disabled={isDeactivating}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void handleConfirmDeactivate()}
              disabled={isDeactivating}
              className="gap-1.5"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Vô hiệu hóa ngay</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
