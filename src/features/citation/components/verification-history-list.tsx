import { Clock, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  getVerdictConfig,
  type VerifyCitationResponse,
} from '../types/verification.types'

export interface VerificationHistoryListProps {
  history: VerifyCitationResponse[]
  activeId?: string | null
  onSelect: (item: VerifyCitationResponse) => void
  onDelete: (id: string) => void
  onClear: () => void
  className?: string
}

export function VerificationHistoryList({
  history,
  activeId,
  onSelect,
  onDelete,
  onClear,
  className,
}: VerificationHistoryListProps) {
  if (history.length === 0) {
    return (
      <div
        className={cn(
          'border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs',
          className,
        )}
      >
        <Clock className="text-muted-foreground/60 mx-auto mb-2 size-6" />
        <p className="font-medium">Chưa có lịch sử thẩm định</p>
        <p className="text-muted-foreground/80 mt-1 text-[11px]">
          Các kết quả thẩm định nhận định pháp lý của bạn sẽ được lưu tại đây để tra cứu
          lại.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('border-border bg-card rounded-xl border p-4', className)}>
      <div className="border-border/60 mb-2 flex items-center justify-between border-b pb-3">
        <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
          <Clock className="text-primary size-3.5" />
          <span>Lịch sử thẩm định gần đây ({history.length})</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive h-6 px-2 text-[11px]"
        >
          Xóa tất cả
        </Button>
      </div>

      <ScrollArea className="max-h-[320px]">
        <div className="space-y-2 pr-2">
          {history.map((item) => {
            const config = getVerdictConfig(item.verdict)
            const isActive = item.id === activeId

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={cn(
                  'group flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-2.5 text-xs transition-all',
                  isActive
                    ? 'border-primary/50 bg-primary/5 shadow-xs'
                    : 'border-border/60 hover:border-border hover:bg-muted/40',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant={config.badgeVariant}
                      className={cn('px-1.5 py-0 text-[10px]', config.badgeClass)}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(item.verifiedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-foreground line-clamp-2 leading-snug font-medium">
                    {item.claim}
                  </p>

                  {item.citedArticle && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                      {item.citedArticle}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.id)
                  }}
                  className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                  title="Xóa khỏi lịch sử"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
