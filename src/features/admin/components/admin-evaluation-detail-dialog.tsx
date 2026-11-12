import { Loader2, Star, ThumbsDown, ThumbsUp } from 'lucide-react'
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
import type { AiEvaluation } from '../types/admin.types'
import {
  formatAdminDateTime,
  getRoleBadgeVariant,
  getRoleDisplayLabel,
} from '../utils/admin-formatters'

interface AdminEvaluationDetailDialogProps {
  evaluation: AiEvaluation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
}

export function AdminEvaluationDetailDialog({
  evaluation,
  open,
  onOpenChange,
  isLoading,
}: AdminEvaluationDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết đánh giá câu trả lời AI</DialogTitle>
          <DialogDescription>
            Thông tin phản hồi từ người dùng về chất lượng tư vấn và trích dẫn.
          </DialogDescription>
        </DialogHeader>

        {evaluation ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getRoleBadgeVariant(evaluation.evaluatorRole)}>
                {getRoleDisplayLabel(evaluation.evaluatorRole)}
              </Badge>

              {evaluation.isHelpful === true ? (
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                  <ThumbsUp className="mr-1 size-3" />
                  Hữu ích
                </Badge>
              ) : evaluation.isHelpful === false ? (
                <Badge variant="destructive">
                  <ThumbsDown className="mr-1 size-3" />
                  Chưa hữu ích
                </Badge>
              ) : (
                <Badge variant="outline">Chưa chọn hữu ích</Badge>
              )}

              {evaluation.rating !== null && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-500" />
                  <span>{evaluation.rating}/5 sao</span>
                </Badge>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-muted-foreground mb-1 text-xs font-medium">
                Nhận xét chi tiết
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {evaluation.feedbackComment?.trim() ||
                  'Người dùng không để lại nhận xét.'}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground">Mã đánh giá</p>
                <p className="font-mono break-all">{evaluation.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Mã tin nhắn (Message ID)</p>
                <p className="font-mono break-all">{evaluation.messageId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Mã người đánh giá</p>
                <p className="font-mono break-all">
                  {evaluation.evaluatorUserId || 'Không xác định'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Thời gian gửi</p>
                <p className="font-medium">{formatAdminDateTime(evaluation.createdAt)}</p>
              </div>
            </div>

            {evaluation.updatedAt && (
              <p className="text-muted-foreground text-xs">
                Cập nhật lần cuối: {formatAdminDateTime(evaluation.updatedAt)}
              </p>
            )}

            {isLoading && (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang tải chi tiết mới nhất...</span>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
