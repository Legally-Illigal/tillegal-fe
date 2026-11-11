import { Check, Copy, ExternalLink, Info, Scale, ShieldCheck } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  type CitationItem,
  getCitationDisplayTitle,
  getCitationReference,
} from '../types/citation.types'

export interface CitationDrawerProps {
  citation: CitationItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CitationDrawer({ citation, open, onOpenChange }: CitationDrawerProps) {
  const [copied, setCopied] = React.useState(false)

  if (!citation) {
    return null
  }

  const title = getCitationDisplayTitle(citation)
  const reference = getCitationReference(citation)

  const handleCopy = async () => {
    const textToCopy = [
      title,
      reference ? `Căn cứ: ${reference}` : '',
      citation.citedText ? `Trích đoạn: "${citation.citedText}"` : '',
      citation.sourceUrl ? `Nguồn: ${citation.sourceUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success('Đã sao chép căn cứ điều luật')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép vào bộ nhớ tạm')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col justify-between p-0 sm:max-w-lg"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-border/60 border-b p-6">
            <div className="mb-1 flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 text-[11px] font-semibold"
              >
                Căn cứ trích dẫn [{citation.index}]
              </Badge>
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-50 text-[10px] font-normal text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <ShieldCheck className="size-3" />
                Văn bản pháp luật hiện hành
              </Badge>
            </div>
            <SheetTitle className="text-foreground text-lg leading-snug font-bold">
              {title}
            </SheetTitle>
            {reference && (
              <SheetDescription className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs font-medium">
                <Scale className="text-primary size-3.5 shrink-0" />
                <span>{reference}</span>
              </SheetDescription>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Information Grid */}
              <div className="bg-muted/40 border-border/50 grid grid-cols-2 gap-3 rounded-lg border p-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                    Số hiệu văn bản
                  </span>
                  <span className="text-foreground font-medium">
                    {citation.documentNumber || 'Đang cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] font-semibold uppercase">
                    Điều khoản căn cứ
                  </span>
                  <span className="text-foreground font-medium">
                    {citation.articleReference || 'Toàn văn bản'}
                  </span>
                </div>
              </div>

              {/* Cited text */}
              <div>
                <h4 className="text-muted-foreground mb-2 flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
                  <span>Toàn văn trích đoạn điều luật</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </Button>
                </h4>

                {citation.citedText ? (
                  <div className="border-primary/20 bg-primary/5 text-foreground/90 rounded-lg border p-4 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {citation.citedText}
                  </div>
                ) : (
                  <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs italic">
                    Trích đoạn chi tiết đang được AI đồng bộ từ cơ sở dữ liệu văn bản gốc.
                  </p>
                )}
              </div>

              {/* Source link */}
              {citation.sourceUrl && (
                <div className="border-border bg-card flex items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">Cổng tra cứu chính thức</p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      {citation.sourceUrl}
                    </p>
                  </div>
                  <a
                    href={citation.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                      Tra cứu gốc
                      <ExternalLink className="size-3" />
                    </Button>
                  </a>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-900 dark:text-amber-200">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="leading-relaxed">
                  Trích dẫn được trích xuất tự động qua mô hình AI phục vụ đối chiếu tình
                  huống pháp lý. Vui lòng kiểm tra hiệu lực sửa đổi, bổ sung mới nhất tại
                  cơ quan có thẩm quyền.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
