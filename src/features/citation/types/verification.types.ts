export type VerificationVerdict =
  | 'supported' // Căn cứ xác thực hoàn toàn
  | 'refuted' // Bác bỏ / Căn cứ sai lệch hoặc không áp dụng
  | 'partially_supported' // Đúng một phần / Cần điều kiện bổ sung
  | 'uncertain' // Không đủ căn cứ để kết luận

export type IssueSeverity = 'high' | 'medium' | 'low'

export interface VerificationIssue {
  type: string
  severity: IssueSeverity
  description: string
  recommendation?: string
}

export interface ApplicableLaw {
  documentTitle: string
  documentNumber: string
  articleReference: string
  sourceUrl?: string
}

export interface VerifyCitationRequest {
  claim: string
  citedArticle?: string
  citedText?: string
}

export interface VerifyCitationResponse {
  id: string
  claim: string
  citedArticle?: string
  citedText?: string
  isSupported: boolean
  confidenceScore: number // 0.0 -> 1.0 (ví dụ: 0.95 = 95%)
  verdict: VerificationVerdict
  verdictLabel: string
  summaryAnalysis: string
  applicableLaw?: ApplicableLaw
  issues: VerificationIssue[]
  legalAdvice?: string
  verifiedAt: string
}

export interface SampleVerificationScenario {
  id: string
  title: string
  tag: string
  category: 'civil' | 'labor' | 'land' | 'traffic' | 'business'
  request: VerifyCitationRequest
  expectedVerdict: VerificationVerdict
}

/**
 * Trả về màu sắc và nhãn hiển thị cho kết quả thẩm định
 */
export function getVerdictConfig(verdict: VerificationVerdict): {
  label: string
  badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary'
  badgeClass: string
  bgClass: string
  borderClass: string
  textClass: string
} {
  switch (verdict) {
    case 'supported':
      return {
        label: 'Đúng căn cứ pháp luật',
        badgeVariant: 'secondary',
        badgeClass:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        bgClass: 'bg-emerald-500/5',
        borderClass: 'border-emerald-500/30',
        textClass: 'text-emerald-700 dark:text-emerald-400',
      }
    case 'refuted':
      return {
        label: 'Bác bỏ / Sai lệch căn cứ',
        badgeVariant: 'destructive',
        badgeClass:
          'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        bgClass: 'bg-rose-500/5',
        borderClass: 'border-rose-500/30',
        textClass: 'text-rose-700 dark:text-rose-400',
      }
    case 'partially_supported':
      return {
        label: 'Đúng một phần (Có điều kiện)',
        badgeVariant: 'outline',
        badgeClass:
          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        bgClass: 'bg-amber-500/5',
        borderClass: 'border-amber-500/30',
        textClass: 'text-amber-700 dark:text-amber-400',
      }
    case 'uncertain':
    default:
      return {
        label: 'Chưa đủ cơ sở xác định',
        badgeVariant: 'outline',
        badgeClass:
          'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        bgClass: 'bg-slate-500/5',
        borderClass: 'border-slate-500/30',
        textClass: 'text-slate-700 dark:text-slate-400',
      }
  }
}

/**
 * Trả về cấu hình hiển thị mức độ nghiêm trọng của vấn đề phát hiện
 */
export function getSeverityConfig(severity: IssueSeverity): {
  label: string
  badgeClass: string
} {
  switch (severity) {
    case 'high':
      return {
        label: 'Rủi ro cao',
        badgeClass:
          'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-900',
      }
    case 'medium':
      return {
        label: 'Lưu ý',
        badgeClass:
          'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      }
    case 'low':
    default:
      return {
        label: 'Khuyến nghị',
        badgeClass:
          'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      }
  }
}
