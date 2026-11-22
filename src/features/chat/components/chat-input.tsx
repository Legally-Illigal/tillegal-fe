import { ArrowUp, FileText, Loader2, Paperclip, Sparkles, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { AttachmentUploadTask, ConversationAttachment } from '../types/chat.types'
import {
  ACCEPTED_ATTACHMENT_INPUT,
  getAttachmentStatusMeta,
} from '../utils/attachment-helpers'

export interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  attachments?: ConversationAttachment[]
  uploadTasks?: AttachmentUploadTask[]
  isUploadingAttachment?: boolean
  onUploadFiles?: (files: FileList | File[]) => void | Promise<void>
  onOpenAttachments?: () => void
  onDeleteAttachment?: (attachmentId: string) => void | Promise<void>
}

const QUICK_CHIPS = [
  'Tóm tắt điều khoản căn cứ',
  'Mức xử phạt theo quy định',
  'Trình tự thủ tục thực hiện',
]

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = 'Đặt câu hỏi hoặc mô tả tình huống pháp lý của bạn...',
  className,
  attachments = [],
  uploadTasks = [],
  isUploadingAttachment = false,
  onUploadFiles,
  onOpenAttachments,
  onDeleteAttachment,
}: ChatInputProps) {
  const [content, setContent] = React.useState('')
  const [isDragging, setIsDragging] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const isSubmittingRef = React.useRef(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUploadFiles && e.target.files && e.target.files.length > 0) {
      void onUploadFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    if (!onUploadFiles) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      void onUploadFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    if (!onUploadFiles) return
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault()
      if (!isDragging) setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    if (!onUploadFiles) return
    e.preventDefault()
    setIsDragging(false)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || isLoading || disabled || isSubmittingRef.current) return

    isSubmittingRef.current = true
    onSend(trimmed)
    setContent('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setTimeout(() => {
      isSubmittingRef.current = false
    }, 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Tránh gửi nhầm khi đang gõ dấu tiếng Việt (IME composing)
      if (e.nativeEvent.isComposing) return
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    // Auto grow textarea
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const handleChipClick = (chip: string) => {
    setContent((prev) => (prev ? `${prev.trim()} (${chip})` : chip))
    textareaRef.current?.focus()
  }

  return (
    <div className={cn('mx-auto w-full max-w-4xl px-4', className)}>
      {/* Quick Chips */}
      <div className="mb-2 hidden items-center gap-1.5 overflow-x-auto pb-1 text-[11px] sm:flex">
        <div className="text-muted-foreground mr-1 flex items-center gap-1">
          <Sparkles className="text-primary size-3" />
          <span>Gợi ý:</span>
        </div>
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(chip)}
            className="hover:border-primary/50 hover:bg-primary/5 bg-background border-border/80 text-muted-foreground hover:text-foreground shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <form
        onSubmit={handleSubmit}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-border/80 bg-background focus-within:border-primary/60 focus-within:ring-primary/20 relative rounded-2xl border p-2 shadow-xs transition-all focus-within:ring-2',
          isDragging && 'border-primary bg-primary/5 ring-primary/30 ring-2',
        )}
      >
        {(attachments.length > 0 || uploadTasks.length > 0) && (
          <div className="border-border/40 mb-1.5 flex max-h-24 flex-wrap items-center gap-1.5 overflow-y-auto border-b px-1.5 pb-2">
            {uploadTasks
              .filter((t) => t.status === 'uploading')
              .map((task) => (
                <Badge
                  key={task.tempId}
                  variant="secondary"
                  className="bg-primary/10 text-primary max-w-[200px] gap-1.5 py-0.5 text-[11px] font-normal"
                >
                  <Loader2 className="size-3 shrink-0 animate-spin" />
                  <span className="truncate">{task.fileName}</span>
                  <span className="shrink-0 font-mono text-[10px]">{task.progress}%</span>
                </Badge>
              ))}

            {attachments.map((att) => {
              const statusMeta = getAttachmentStatusMeta(att.processingStatus)
              return (
                <div
                  key={att.id}
                  className="border-border/70 bg-muted/40 flex max-w-[220px] items-center gap-1 rounded-full border py-0.5 pr-1 pl-2 text-[11px]"
                >
                  <button
                    type="button"
                    onClick={onOpenAttachments}
                    className="flex min-w-0 items-center gap-1 text-left hover:underline"
                    title={`${att.fileName || 'Tài liệu'} (${statusMeta.label})`}
                  >
                    <FileText className="text-primary size-3 shrink-0" />
                    <span className="truncate font-medium">
                      {att.fileName || 'Tài liệu'}
                    </span>
                  </button>
                  {statusMeta.isProcessing && (
                    <Loader2 className="text-primary size-2.5 shrink-0 animate-spin" />
                  )}
                  {onDeleteAttachment && (
                    <button
                      type="button"
                      onClick={() => void onDeleteAttachment(att.id)}
                      className="text-muted-foreground hover:text-destructive rounded-full p-0.5 transition-colors"
                      aria-label={`Gỡ tài liệu ${att.fileName || att.id}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className="max-h-[160px] min-h-[44px] w-full resize-none border-0 bg-transparent px-2 py-2 text-xs leading-relaxed shadow-none focus-visible:ring-0 sm:text-sm"
        />

        <div className="border-border/40 flex items-center justify-between border-t px-1 pt-1.5">
          <div className="flex items-center gap-2">
            {onUploadFiles && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_ATTACHMENT_INPUT}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Đính kèm tài liệu"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isUploadingAttachment}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-xs"
                  title="Tải tài liệu lên hội thoại"
                >
                  {isUploadingAttachment ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Paperclip className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">Đính kèm</span>
                </Button>
              </>
            )}

            {onOpenAttachments && attachments.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenAttachments}
                className="text-primary h-7 px-2 text-xs font-medium"
              >
                Tài liệu ({attachments.length})
              </Button>
            )}

            <span className="text-muted-foreground hidden text-[10px] md:inline">
              Nhấn <kbd className="bg-muted rounded px-1 font-mono">Enter</kbd> để gửi,{' '}
              <kbd className="bg-muted rounded px-1 font-mono">Shift + Enter</kbd> để
              xuống dòng
            </span>
          </div>

          <Button
            type="submit"
            size="icon-sm"
            disabled={!content.trim() || isLoading || disabled}
            className="ml-auto rounded-xl shadow-xs transition-all"
            aria-label="Gửi câu hỏi"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
