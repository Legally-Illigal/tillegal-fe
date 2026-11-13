import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Info,
  Loader2,
  Paperclip,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { AttachmentUploadTask, ConversationAttachment } from '../types/chat.types'
import {
  ACCEPTED_ATTACHMENT_INPUT,
  formatAttachmentDateTime,
  formatFileSize,
  getAttachmentStatusMeta,
} from '../utils/attachment-helpers'

export interface AttachmentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attachments: ConversationAttachment[]
  isLoading: boolean
  uploadTasks: AttachmentUploadTask[]
  deletingIds?: string[]
  downloadingId?: string | null
  onUploadFiles: (files: FileList | File[]) => void | Promise<void>
  onRefresh?: () => void | Promise<void>
  onRefreshDetail?: (attachmentId: string) => Promise<ConversationAttachment | null>
  onDelete: (attachmentId: string) => void | Promise<void>
  onDownload: (attachment: ConversationAttachment) => void | Promise<void>
  onDismissUploadTask?: (tempId: string) => void
  onClearFailedUploadTasks?: () => void
}

export function AttachmentDrawer({
  open,
  onOpenChange,
  attachments,
  isLoading,
  uploadTasks,
  deletingIds = [],
  downloadingId = null,
  onUploadFiles,
  onRefresh,
  onRefreshDetail,
  onDelete,
  onDownload,
  onDismissUploadTask,
  onClearFailedUploadTasks,
}: AttachmentDrawerProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [refreshingDetailId, setRefreshingDetailId] = React.useState<string | null>(null)

  const filteredAttachments = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return attachments
    return attachments.filter((item) => {
      const name = (item.fileName || '').toLowerCase()
      const type = (item.contentType || '').toLowerCase()
      const hash = (item.fileHash || '').toLowerCase()
      const status = getAttachmentStatusMeta(item.processingStatus).label.toLowerCase()
      return (
        name.includes(q) || type.includes(q) || hash.includes(q) || status.includes(q)
      )
    })
  }, [attachments, searchQuery])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void onUploadFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void onUploadFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleToggleMetadata = async (attachmentId: string) => {
    if (expandedId === attachmentId) {
      setExpandedId(null)
      return
    }
    setExpandedId(attachmentId)
  }

  const handleRefreshSingleDetail = async (attachmentId: string) => {
    if (!onRefreshDetail) return
    setRefreshingDetailId(attachmentId)
    try {
      await onRefreshDetail(attachmentId)
    } finally {
      setRefreshingDetailId((prev) => (prev === attachmentId ? null : prev))
    }
  }

  const hasFailedUploadTasks = React.useMemo(
    () => uploadTasks.some((task) => task.status === 'error'),
    [uploadTasks],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full max-h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-border/60 shrink-0 border-b p-6 pb-4">
          <div className="mb-1 flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-primary/5 text-primary border-primary/20 gap-1 text-[11px] font-semibold"
            >
              <Paperclip className="size-3" />
              Tài liệu hội thoại ({attachments.length})
            </Badge>
          </div>
          <SheetTitle className="text-foreground text-lg leading-snug font-bold">
            Tải lên &amp; Quản lý tài liệu
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            Đính kèm hợp đồng, văn bản hoặc hồ sơ để trợ lý đối chiếu trong cuộc trò
            chuyện này. Hệ thống tự động trích xuất metadata sau khi tải lên.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Upload Dropzone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'border-border/80 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors',
                isDragging && 'border-primary bg-primary/10',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_ATTACHMENT_INPUT}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Chọn tệp tài liệu tải lên"
              />
              <div className="bg-primary/10 text-primary mb-2.5 flex size-10 items-center justify-center rounded-full">
                <UploadCloud className="size-5" />
              </div>
              <p className="text-foreground text-xs font-semibold sm:text-sm">
                Kéo thả tài liệu vào đây hoặc chọn từ thiết bị
              </p>
              <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                Hỗ trợ PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, WEBP (tối đa 20 MB/tệp)
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-3.5" />
                <span>Chọn tài liệu</span>
              </Button>
            </div>

            {/* Active / Failed Upload Tasks */}
            {uploadTasks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                    Tiến trình tải lên ({uploadTasks.length})
                  </h4>
                  {hasFailedUploadTasks && onClearFailedUploadTasks && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onClearFailedUploadTasks}
                      className="text-muted-foreground hover:text-foreground h-6 px-2 text-[11px]"
                    >
                      Xóa thông báo lỗi
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {uploadTasks.map((task) => (
                    <div
                      key={task.tempId}
                      className={cn(
                        'border-border/70 bg-card rounded-lg border p-3 text-xs',
                        task.status === 'error' &&
                          'border-destructive/40 bg-destructive/5',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate font-medium">
                            {task.fileName}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            {formatFileSize(task.fileSize)}
                            {task.status === 'uploading' &&
                              ` • Đang tải lên ${task.progress}%`}
                          </p>
                        </div>

                        {task.status === 'uploading' ? (
                          <Loader2 className="text-primary size-4 shrink-0 animate-spin" />
                        ) : (
                          onDismissUploadTask && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => onDismissUploadTask(task.tempId)}
                              aria-label="Đóng thông báo lỗi tải lên"
                            >
                              <X className="size-3.5" />
                            </Button>
                          )
                        )}
                      </div>

                      {task.status === 'uploading' ? (
                        <Progress value={task.progress} className="mt-2 h-1.5" />
                      ) : (
                        <div className="text-destructive mt-1.5 flex items-center gap-1.5 text-[11px]">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{task.error || 'Tải lên thất bại'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search & Refresh Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                  Danh sách tài liệu ({filteredAttachments.length})
                </h4>
                {onRefresh && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void onRefresh()}
                    disabled={isLoading}
                    className="h-7 gap-1 px-2 text-xs"
                  >
                    <RefreshCw className={cn('size-3', isLoading && 'animate-spin')} />
                    <span>Làm mới</span>
                  </Button>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên tệp, trạng thái, loại file..."
                    className="h-8 pl-8 text-xs"
                    aria-label="Tìm kiếm tài liệu"
                  />
                </div>
              )}

              {/* Attachments List */}
              {isLoading && attachments.length === 0 ? (
                <div className="text-muted-foreground flex items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-xs">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Đang tải danh sách tài liệu...</span>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                  Chưa có tài liệu nào được tải lên trong cuộc trò chuyện này.
                </div>
              ) : filteredAttachments.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                  Không tìm thấy tài liệu phù hợp với từ khóa &ldquo;{searchQuery}
                  &rdquo;.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAttachments.map((attachment) => {
                    const statusMeta = getAttachmentStatusMeta(
                      attachment.processingStatus,
                    )
                    const isExpanded = expandedId === attachment.id
                    const isDeleting = deletingIds.includes(attachment.id)
                    const isDownloading = downloadingId === attachment.id
                    const isRefreshingDetail = refreshingDetailId === attachment.id

                    return (
                      <div
                        key={attachment.id}
                        className="border-border/80 bg-card rounded-xl border p-3.5 shadow-2xs transition-colors"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <FileText className="size-4" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <p
                                className="text-foreground truncate text-xs font-semibold sm:text-sm"
                                title={attachment.fileName || attachment.id}
                              >
                                {attachment.fileName || 'Tài liệu không tên'}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'shrink-0 px-1.5 py-0 text-[10px] font-medium',
                                  statusMeta.badgeClassName,
                                )}
                              >
                                {statusMeta.isProcessing && (
                                  <Loader2 className="mr-1 size-2.5 animate-spin" />
                                )}
                                {statusMeta.label}
                              </Badge>
                            </div>

                            <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
                              <span>{formatFileSize(attachment.fileSize)}</span>
                              {attachment.tokenCount != null && (
                                <span>
                                  • {attachment.tokenCount.toLocaleString('vi-VN')} tokens
                                </span>
                              )}
                              <span>
                                • {formatAttachmentDateTime(attachment.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Row */}
                        <div className="border-border/40 mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t pt-2.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-[11px]"
                            onClick={() => void handleToggleMetadata(attachment.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-3.5" />
                            ) : (
                              <ChevronDown className="size-3.5" />
                            )}
                            <span>Metadata hệ thống</span>
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 px-2 text-[11px]"
                              disabled={isDownloading || isDeleting}
                              onClick={() => void onDownload(attachment)}
                            >
                              {isDownloading ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Download className="size-3" />
                              )}
                              <span>Tải về</span>
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 gap-1 px-2 text-[11px]"
                              disabled={isDeleting}
                              onClick={() => void onDelete(attachment.id)}
                              aria-label={`Xóa tài liệu ${attachment.fileName || attachment.id}`}
                            >
                              {isDeleting ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Trash2 className="size-3" />
                              )}
                              <span>Xóa</span>
                            </Button>
                          </div>
                        </div>

                        {/* System-returned Metadata Panel */}
                        {isExpanded && (
                          <div className="bg-muted/40 border-border/50 mt-2.5 space-y-2 rounded-lg border p-2.5 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground font-semibold uppercase">
                                Thông tin trích xuất từ hệ thống
                              </span>
                              {onRefreshDetail && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 gap-1 px-1.5 text-[10px]"
                                  disabled={isRefreshingDetail}
                                  onClick={() =>
                                    void handleRefreshSingleDetail(attachment.id)
                                  }
                                >
                                  <RefreshCw
                                    className={cn(
                                      'size-2.5',
                                      isRefreshingDetail && 'animate-spin',
                                    )}
                                  />
                                  <span>Cập nhật</span>
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Định dạng (MIME)
                                </span>
                                <span className="text-foreground font-medium break-all">
                                  {attachment.contentType || 'Không xác định'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Trạng thái xử lý
                                </span>
                                <span className="text-foreground font-medium">
                                  {attachment.processingStatus || '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Số lượng Token
                                </span>
                                <span className="text-foreground font-medium">
                                  {attachment.tokenCount != null
                                    ? attachment.tokenCount.toLocaleString('vi-VN')
                                    : 'Chưa có'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">
                                  Cập nhật lúc
                                </span>
                                <span className="text-foreground font-medium">
                                  {formatAttachmentDateTime(attachment.updatedAt)}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground block text-[10px]">
                                  Mã băm (File Hash)
                                </span>
                                <span className="text-foreground font-mono text-[10px] break-all">
                                  {attachment.fileHash || 'Đang cập nhật'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-muted-foreground block text-[10px]">
                                  ID tài liệu
                                </span>
                                <span className="text-foreground font-mono text-[10px] break-all">
                                  {attachment.id}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-[11px] text-blue-900 dark:text-blue-200">
              <Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="leading-relaxed">
                Tài liệu tải lên được gắn trực tiếp vào cuộc trò chuyện hiện tại. Khi
                trạng thái chuyển sang <strong>Sẵn sàng</strong>, bạn có thể đặt câu hỏi
                xoay quanh nội dung văn bản vừa tải lên.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
