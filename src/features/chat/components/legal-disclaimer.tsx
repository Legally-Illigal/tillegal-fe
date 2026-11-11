import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LegalDisclaimerProps {
  className?: string
}

export function LegalDisclaimer({ className }: LegalDisclaimerProps) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center justify-center gap-1.5 px-4 py-2 text-center text-[11px]',
        className,
      )}
    >
      <AlertTriangle className="size-3 shrink-0 text-amber-500/80" />
      <span>
        Nội dung do AI cung cấp chỉ mang tính tham khảo, không thay thế ý kiến tư vấn pháp
        lý chính thức.
      </span>
    </div>
  )
}
