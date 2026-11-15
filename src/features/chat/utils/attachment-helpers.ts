import { ApiError } from '@/lib/api'

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export const ACCEPTED_ATTACHMENT_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.doc',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
] as const

export const ACCEPTED_ATTACHMENT_INPUT = ACCEPTED_ATTACHMENT_EXTENSIONS.join(',')

export interface AttachmentValidationResult {
  valid: boolean
  error?: string
}

export function validateAttachmentFile(file: File): AttachmentValidationResult {
  if (!file || !file.name) {
    return { valid: false, error: 'Tệp tải lên không hợp lệ.' }
  }

  if (file.size <= 0) {
    return { valid: false, error: `Tệp "${file.name}" đang trống (0 B).` }
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `Tệp "${file.name}" vượt quá giới hạn tối đa ${formatFileSize(MAX_ATTACHMENT_SIZE_BYTES)}.`,
    }
  }

  const lowerName = file.name.toLowerCase()
  const hasSupportedExtension = ACCEPTED_ATTACHMENT_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  )

  if (!hasSupportedExtension) {
    return {
      valid: false,
      error: `Định dạng tệp "${file.name}" chưa được hỗ trợ. Định dạng hợp lệ: PDF, DOCX, DOC, TXT, PNG, JPG, JPEG, WEBP.`,
    }
  }

  return { valid: true }
}

/**
 * Chuẩn hóa thông báo lỗi upload tài liệu từ backend ProblemDetails/DomainException
 */
export function formatAttachmentErrorMessage(err: unknown, fileName?: string): string {
  const name = fileName ? `"${fileName}"` : 'Tệp'
  const apiError = err instanceof ApiError ? err : null
  const code = apiError?.code?.toUpperCase()
  const rawMsg = (err as Error)?.message || ''

  if (code === 'DUPLICATE_FILE' || /already been uploaded/i.test(rawMsg)) {
    return `${name} đã được tải lên trong cuộc trò chuyện này (trùng nội dung).`
  }

  if (
    code === 'ATTACHMENT_LIMIT_EXCEEDED' ||
    /at most \d+ attachments/i.test(rawMsg) ||
    /tối đa 5 tài liệu/i.test(rawMsg)
  ) {
    return 'Cuộc trò chuyện này đã đạt giới hạn tối đa 5 tài liệu đính kèm.'
  }

  if (
    code === 'INVALID_FILE_SIGNATURE' ||
    /file signature does not match/i.test(rawMsg) ||
    /chữ ký tệp/i.test(rawMsg)
  ) {
    return `Nội dung của ${name} không hợp lệ hoặc không khớp với định dạng tệp (chữ ký tệp không hợp lệ).`
  }

  if (apiError?.status === 413 || /exceed 20 mb/i.test(rawMsg)) {
    return `${name} vượt quá dung lượng tối đa 20 MB.`
  }

  if (apiError?.status === 403 || /not allowed to upload/i.test(rawMsg)) {
    return 'Bạn không có quyền quản lý tài liệu trong cuộc trò chuyện này.'
  }

  return rawMsg || `Không thể tải lên ${name}. Vui lòng thử lại.`
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
    return '0 B'
  }
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export type AttachmentStatusTone =
  'pending' | 'processing' | 'completed' | 'failed' | 'unknown'

export interface AttachmentStatusMeta {
  label: string
  tone: AttachmentStatusTone
  badgeClassName: string
  isProcessing: boolean
}

export function getAttachmentStatusMeta(
  status: string | null | undefined,
): AttachmentStatusMeta {
  const normalized = (status || '').trim().toLowerCase()

  if (normalized === 'pending' || normalized === 'queued' || normalized === 'uploaded') {
    return {
      label: 'Đang chờ xử lý',
      tone: 'pending',
      badgeClassName:
        'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
      isProcessing: true,
    }
  }

  if (
    normalized === 'processing' ||
    normalized === 'indexing' ||
    normalized === 'extracting'
  ) {
    return {
      label: 'Đang lập chỉ mục',
      tone: 'processing',
      badgeClassName:
        'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
      isProcessing: true,
    }
  }

  if (
    normalized === 'completed' ||
    normalized === 'processed' ||
    normalized === 'ready' ||
    normalized === 'indexed' ||
    normalized === 'succeeded'
  ) {
    return {
      label: 'Sẵn sàng',
      tone: 'completed',
      badgeClassName:
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      isProcessing: false,
    }
  }

  if (normalized === 'failed' || normalized === 'error') {
    return {
      label: 'Xử lý lỗi',
      tone: 'failed',
      badgeClassName: 'border-destructive/30 bg-destructive/10 text-destructive',
      isProcessing: false,
    }
  }

  return {
    label: status?.trim() || 'Đã tải lên',
    tone: 'unknown',
    badgeClassName: 'border-border bg-muted text-muted-foreground',
    isProcessing: false,
  }
}

export function formatAttachmentDateTime(isoString?: string | null): string {
  if (!isoString) return '—'
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
