import { FileText, Loader2, RotateCcw, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { VerifyCitationRequest } from '../types/verification.types'

export interface VerificationFormProps {
  onSubmit: (data: VerifyCitationRequest) => void
  isLoading?: boolean
  initialData?: VerifyCitationRequest | null
  className?: string
}

export function VerificationForm({
  onSubmit,
  isLoading = false,
  initialData,
  className,
}: VerificationFormProps) {
  const [claim, setClaim] = React.useState(initialData?.claim || '')
  const [citedArticle, setCitedArticle] = React.useState(initialData?.citedArticle || '')
  const [citedText, setCitedText] = React.useState(initialData?.citedText || '')
  const [showTextarea, setShowTextarea] = React.useState(Boolean(initialData?.citedText))

  React.useEffect(() => {
    if (initialData) {
      setClaim(initialData.claim)
      setCitedArticle(initialData.citedArticle || '')
      setCitedText(initialData.citedText || '')
      if (initialData.citedText) {
        setShowTextarea(true)
      }
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedClaim = claim.trim()
    if (!trimmedClaim || isLoading) return

    onSubmit({
      claim: trimmedClaim,
      citedArticle: citedArticle.trim() || undefined,
      citedText: citedText.trim() || undefined,
    })
  }

  const handleReset = () => {
    setClaim('')
    setCitedArticle('')
    setCitedText('')
    setShowTextarea(false)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-4">
        {/* Claim Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="vf-claim"
              className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
            >
              <Scale className="text-primary size-3.5" />
              <span>Nhận định pháp lý hoặc luận điểm cần thẩm định</span>
              <span className="text-destructive">*</span>
            </Label>
            <span className="text-muted-foreground text-[11px]">{claim.length}/1000</span>
          </div>

          <Textarea
            id="vf-claim"
            placeholder="Ví dụ: Hợp đồng đặt cọc mua bán nhà đất bắt buộc phải công chứng mới có hiệu lực pháp luật..."
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            disabled={isLoading}
            rows={3}
            maxLength={1000}
            required
            className="focus-visible:ring-primary/20 resize-none text-xs leading-relaxed sm:text-sm"
          />
          <p className="text-muted-foreground text-[11px]">
            Nhập quan điểm, phát biểu, cam kết hợp đồng hoặc nhận định pháp lý bạn muốn
            kiểm tra tính đúng đắn.
          </p>
        </div>

        {/* Cited Law or Article */}
        <div className="space-y-1.5">
          <Label
            htmlFor="vf-article"
            className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
          >
            <FileText className="text-primary size-3.5" />
            <span>Văn bản quy phạm pháp luật hoặc điều khoản viện dẫn (tùy chọn)</span>
          </Label>
          <Input
            id="vf-article"
            placeholder="Ví dụ: Bộ luật Dân sự 2015, Luật Đất đai 2024 (Điều 45), hoặc Nghị định 100/2019/NĐ-CP..."
            value={citedArticle}
            onChange={(e) => setCitedArticle(e.target.value)}
            disabled={isLoading}
            className="text-xs sm:text-sm"
          />
          <p className="text-muted-foreground text-[11px]">
            Nếu để trống, AI sẽ tự động rà soát toàn bộ hệ thống pháp luật Việt Nam để tìm
            kiếm căn cứ tương ứng.
          </p>
        </div>

        {/* Collapsible Cited Text */}
        <div>
          {!showTextarea ? (
            <button
              type="button"
              onClick={() => setShowTextarea(true)}
              className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              <Sparkles className="size-3" />
              <span>
                + Thêm trích đoạn điều khoản hoặc nội dung văn bản gốc (tùy chọn)
              </span>
            </button>
          ) : (
            <div className="border-border/60 space-y-1.5 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="vf-citedText"
                  className="text-foreground text-xs font-semibold"
                >
                  Trích đoạn nội dung điều khoản (tùy chọn)
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setCitedText('')
                    setShowTextarea(false)
                  }}
                  className="text-muted-foreground hover:text-foreground text-[11px] underline"
                >
                  Thu gọn
                </button>
              </div>
              <Textarea
                id="vf-citedText"
                placeholder="Dán toàn văn đoạn trích của điều luật hoặc điều khoản hợp đồng bạn đang có tại đây..."
                value={citedText}
                onChange={(e) => setCitedText(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="text-xs leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-border/40 flex items-center justify-end gap-2.5 border-t pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={(!claim && !citedArticle && !citedText) || isLoading}
            className="gap-1 text-xs"
          >
            <RotateCcw className="size-3.5" />
            <span>Làm mới</span>
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={!claim.trim() || isLoading}
            className="gap-2 px-5 text-xs font-semibold shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang thẩm định căn cứ...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5" />
                <span>Bắt đầu thẩm định</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
