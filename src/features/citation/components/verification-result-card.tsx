import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Scale,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  getSeverityConfig,
  getVerdictConfig,
  type VerifyCitationResponse,
} from '../types/verification.types'

export interface VerificationResultCardProps {
  result: VerifyCitationResponse
  className?: string
}

export function VerificationResultCard({
  result,
  className,
}: VerificationResultCardProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = React.useState(false)
  const verdictConfig = getVerdictConfig(result.verdict)

  const confidencePercent = Math.round(result.confidenceScore * 100)

  const handleCopy = async () => {
    const reportText = [
      `=== BÁO CÁO THẨM ĐỊNH CĂN CỨ PHÁP LÝ TILLEGAL ===`,
      `Nhận định: "${result.claim}"`,
      result.citedArticle ? `Căn cứ viện dẫn: ${result.citedArticle}` : '',
      `Kết luận: ${verdictConfig.label} (Độ tin cậy: ${confidencePercent}%)`,
      `\n[PHÂN TÍCH CHI TIẾT]`,
      result.summaryAnalysis,
      result.applicableLaw
        ? `\n[VĂN BẢN ÁP DỤNG]\n- ${result.applicableLaw.documentTitle} (${result.applicableLaw.documentNumber})\n- Căn cứ: ${result.applicableLaw.articleReference}`
        : '',
      result.issues.length > 0
        ? `\n[VẤN ĐỀ & RỦI RO PHÁT HIỆN]\n${result.issues
            .map(
              (issue, idx) =>
                `${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`,
            )
            .join('\n')}`
        : '',
      result.legalAdvice ? `\n[KHUYẾN NGHỊ XỬ LÝ]\n${result.legalAdvice}` : '',
      `\nThời gian thẩm định: ${new Date(result.verifiedAt).toLocaleString('vi-VN')}`,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      toast.success('Đã sao chép toàn văn kết quả thẩm định')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép kết quả')
    }
  }

  const handleDeepDive = () => {
    navigate(
      `/chat?q=${encodeURIComponent(`Tôi muốn phân tích sâu hơn về nhận định: "${result.claim}"`)}`,
    )
  }

  const getVerdictIcon = () => {
    switch (result.verdict) {
      case 'supported':
        return <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
      case 'refuted':
        return <XCircle className="size-5 text-rose-600 dark:text-rose-400" />
      case 'partially_supported':
        return <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
      case 'uncertain':
      default:
        return <HelpCircle className="size-5 text-slate-600 dark:text-slate-400" />
    }
  }

  return (
    <Card
      className={cn(
        'overflow-hidden border shadow-sm transition-all',
        verdictConfig.borderClass,
        className,
      )}
    >
      {/* Top Accent Strip */}
      <div
        className={cn(
          'h-1.5 w-full',
          result.verdict === 'supported' && 'bg-emerald-500',
          result.verdict === 'refuted' && 'bg-rose-500',
          result.verdict === 'partially_supported' && 'bg-amber-500',
          result.verdict === 'uncertain' && 'bg-slate-500',
        )}
      />

      <CardHeader className="border-border/50 border-b p-4 pb-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            {getVerdictIcon()}
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={verdictConfig.badgeVariant}
                  className={cn(
                    'px-2 py-0.5 text-xs font-semibold',
                    verdictConfig.badgeClass,
                  )}
                >
                  {result.verdictLabel || verdictConfig.label}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                Thời gian đối chiếu:{' '}
                {new Date(result.verifiedAt).toLocaleTimeString('vi-VN')} -{' '}
                {new Date(result.verifiedAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="bg-muted/40 rounded-lg p-2.5 sm:bg-transparent sm:p-0 sm:text-right">
            <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold sm:justify-end">
              <span>Độ tin cậy căn cứ:</span>
              <span className={cn('font-bold', verdictConfig.textClass)}>
                {confidencePercent}%
              </span>
            </div>
            <div className="mt-1 w-36 sm:ml-auto">
              <Progress value={confidencePercent} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* Claim Recap */}
        <div className="bg-muted/40 border-border/40 mt-4 rounded-lg border p-3 text-xs">
          <span className="text-muted-foreground mb-1 block text-[10px] font-bold uppercase">
            Nhận định thẩm định:
          </span>
          <p className="text-foreground font-medium italic">
            &ldquo;{result.claim}&rdquo;
          </p>
          {result.citedArticle && (
            <p className="text-muted-foreground mt-1.5 text-[11px]">
              <strong>Căn cứ viện dẫn:</strong> {result.citedArticle}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-4 sm:p-6">
        {/* Summary Analysis */}
        <div>
          <CardTitle className="text-foreground mb-2 flex items-center gap-1.5 text-xs font-bold sm:text-sm">
            <Scale className="text-primary size-4" />
            <span>Bản Phân Tích Pháp Lý Chi Tiết</span>
          </CardTitle>
          <div
            className={cn(
              'rounded-lg border p-4 text-xs leading-relaxed sm:text-sm',
              verdictConfig.bgClass,
              verdictConfig.borderClass,
              'text-foreground/90 whitespace-pre-wrap',
            )}
          >
            {result.summaryAnalysis}
          </div>
        </div>

        {/* Applicable Law Box */}
        {result.applicableLaw && (
          <div>
            <h4 className="text-foreground mb-2 flex items-center gap-1.5 text-xs font-bold">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Văn Bản Quy Phạm Pháp Luật Áp Dụng</span>
            </h4>
            <div className="border-border/80 bg-card flex flex-col gap-3 rounded-lg border p-3.5 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-foreground font-semibold">
                  {result.applicableLaw.documentTitle}
                </p>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                  <span>
                    Số hiệu: <strong>{result.applicableLaw.documentNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Căn cứ: <strong>{result.applicableLaw.articleReference}</strong>
                  </span>
                </div>
              </div>

              {result.applicableLaw.sourceUrl && (
                <a
                  href={result.applicableLaw.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    Tra cứu văn bản gốc
                    <ExternalLink className="size-3" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Issues List */}
        {result.issues && result.issues.length > 0 && (
          <div>
            <h4 className="text-foreground mb-2 flex items-center gap-1.5 text-xs font-bold">
              <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" />
              <span>Rủi Ro & Vấn Đề Phát Hiện ({result.issues.length})</span>
            </h4>

            <div className="space-y-2.5">
              {result.issues.map((issue, idx) => {
                const severity = getSeverityConfig(issue.severity)
                return (
                  <div
                    key={idx}
                    className="border-border/60 bg-muted/30 space-y-1.5 rounded-lg border p-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-semibold', severity.badgeClass)}
                      >
                        {severity.label}
                      </Badge>
                      <span className="text-foreground font-medium">
                        {issue.description}
                      </span>
                    </div>

                    {issue.recommendation && (
                      <p className="text-muted-foreground border-primary/40 mt-1 border-l-2 pl-1 text-[11px]">
                        <strong>Khuyến nghị:</strong> {issue.recommendation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legal Advice */}
        {result.legalAdvice && (
          <div className="bg-primary/5 border-primary/20 rounded-lg border p-3.5 text-xs">
            <h4 className="text-primary mb-1 text-xs font-bold">
              Khuyến Nghị Hướng Xử Lý:
            </h4>
            <p className="text-foreground/85 text-xs leading-relaxed">
              {result.legalAdvice}
            </p>
          </div>
        )}

        {/* Toolbar */}
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copied ? 'Đã sao chép' : 'Sao chép kết luận'}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDeepDive}
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <MessageSquare className="size-3.5" />
            <span>Hỏi sâu hơn về tình huống này</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
