import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  Scale,
  Sparkles,
  User,
} from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CitationCard, type CitationItem } from '@/features/citation'
import { cn } from '@/lib/utils'
import type { ConversationMessage } from '../types/chat.types'
import { MessageContent } from './message-content'

export interface MessageItemProps {
  message: ConversationMessage
  onSelectCitation?: (citation: CitationItem) => void
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>
  onEditInPlace?: (messageId: string, newContent: string) => Promise<void>
  onSwitchBranch?: (messageId: string, branchIndex: number) => void
  userInitial?: string
  isLawyer?: boolean
}

export function MessageItem({
  message,
  onSelectCitation,
  onEditMessage,
  onEditInPlace,
  onSwitchBranch,
  userInitial = 'ND',
  isLawyer = false,
}: MessageItemProps) {
  const isUser = message.role === 'user'
  const isMultiAgent =
    !isUser &&
    Boolean(
      isLawyer ||
        message.workflowMode === 'multi_agent' ||
        message.content?.includes('[Đa Agent') ||
        message.content?.includes('Hệ thống đã tổng hợp ý kiến từ nhiều chuyên gia'),
    )
  const [copied, setCopied] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(message.content)
  const [isSavingInPlace, setIsSavingInPlace] = React.useState(false)
  const [isSavingBranch, setIsSavingBranch] = React.useState(false)

  const branches = message.branches || []
  const totalBranches = branches.length
  const activeBranchIndex = message.activeBranchIndex ?? 0
  const hasBranches = totalBranches > 1

  // Đồng bộ editContent khi message thay đổi
  React.useEffect(() => {
    setEditContent(message.content)
  }, [message.content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('Đã sao chép nội dung tin nhắn')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép')
    }
  }

  const handleSaveInPlace = async () => {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false)
      return
    }

    const editFn = onEditInPlace || onEditMessage
    if (editFn) {
      setIsSavingInPlace(true)
      try {
        await editFn(message.id, trimmed)
        setIsEditing(false)
      } catch {
        // Lỗi đã được toast trong hook
      } finally {
        setIsSavingInPlace(false)
      }
    }
  }

  const handleSaveBranch = async () => {
    const trimmed = editContent.trim()
    if (!trimmed) return

    if (onEditMessage) {
      setIsSavingBranch(true)
      try {
        await onEditMessage(message.id, trimmed)
        setIsEditing(false)
      } catch {
        // Lỗi đã được toast trong hook
      } finally {
        setIsSavingBranch(false)
      }
    }
  }

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div
      className={cn(
        'group flex w-full gap-3 py-4 transition-colors',
        isUser ? 'flex-row-reverse justify-start' : 'justify-start',
      )}
    >
      {/* Avatar */}
      <Avatar
        className={cn(
          'size-8 shrink-0 shadow-xs ring-1',
          isUser
            ? 'ring-primary/20 bg-primary/10 text-primary'
            : isMultiAgent
              ? 'ring-primary/30 bg-primary/15 text-primary'
              : 'ring-border bg-card text-foreground',
        )}
      >
        <AvatarFallback className="text-xs font-semibold">
          {isUser ? (
            userInitial ? (
              userInitial
            ) : (
              <User className="size-4" />
            )
          ) : isMultiAgent ? (
            <Sparkles className="text-primary size-4" />
          ) : (
            <Bot className="text-primary size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message Box */}
      <div
        className={cn(
          'flex max-w-[88%] flex-col gap-1 sm:max-w-[80%]',
          isUser && 'items-end',
        )}
      >
        {/* Header / Meta */}
        <div className="text-muted-foreground flex items-center gap-2 px-1 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span>
              {isUser
                ? 'Bạn'
                : isMultiAgent
                  ? 'Trợ lý Tillegal AI (Multi-Agent)'
                  : 'Trợ lý Tillegal AI'}
            </span>
            {isMultiAgent && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 h-4 px-1.5 py-0 text-[10px] font-normal"
              >
                Đa tác tử
              </Badge>
            )}
          </div>
          {message.createdAt && <span>• {formatTime(message.createdAt)}</span>}
          {message.updatedAt && (
            <span className="text-[10px] italic">(đã chỉnh sửa)</span>
          )}

          {/* Branch Navigator */}
          {isUser && (
            <div
              className={cn(
                'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                hasBranches
                  ? 'bg-muted/80 text-foreground'
                  : 'bg-muted/40 text-muted-foreground',
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground h-4 w-4 p-0"
                disabled={!hasBranches || activeBranchIndex <= 0}
                onClick={() => onSwitchBranch?.(message.id, activeBranchIndex - 1)}
                title="Nhánh trước"
                aria-label="Nhánh trước"
              >
                <ChevronLeft className="size-3" />
              </Button>
              <span className="tabular-nums">
                {hasBranches ? `${activeBranchIndex + 1}/${totalBranches}` : '1/1'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground h-4 w-4 p-0"
                disabled={!hasBranches || activeBranchIndex >= totalBranches - 1}
                onClick={() => onSwitchBranch?.(message.id, activeBranchIndex + 1)}
                title="Nhánh tiếp theo"
                aria-label="Nhánh tiếp theo"
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Content Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-xs',
            isEditing
              ? 'bg-card border-border/80 text-foreground w-full min-w-[280px] border sm:min-w-[420px]'
              : isUser
                ? 'bg-primary text-primary-foreground rounded-tr-xs'
                : 'bg-card border-border/80 text-foreground rounded-tl-xs border',
          )}
        >
          {isUser ? (
            isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="focus-visible:ring-primary min-h-20 border-zinc-300 bg-white text-xs text-black placeholder:text-zinc-400 sm:text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="Nhập nội dung chỉnh sửa..."
                  autoFocus
                />
                <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(message.content)
                    }}
                    disabled={isSavingInPlace || isSavingBranch}
                    className="h-7 px-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleSaveInPlace}
                    disabled={
                      !editContent.trim() ||
                      editContent.trim() === message.content ||
                      isSavingInPlace ||
                      isSavingBranch
                    }
                    className="h-7 px-3 text-xs font-medium"
                    title="Sửa trực tiếp nội dung tin nhắn, dùng cho sửa lỗi chính tả"
                  >
                    {isSavingInPlace ? 'Đang lưu...' : 'Sửa tại chỗ'}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="xs"
                    onClick={handleSaveBranch}
                    disabled={!editContent.trim() || isSavingInPlace || isSavingBranch}
                    className="h-7 px-3 text-xs font-medium"
                    title="Tạo nhánh câu hỏi mới kèm câu trả lời tiếp theo từ AI"
                  >
                    {isSavingBranch ? 'Đang tạo...' : 'Tạo nhánh mới'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
                {message.content}
              </p>
            )
          ) : (
            <div className="space-y-4">
              {isMultiAgent && (
                <div className="border-primary/20 bg-primary/5 text-primary mb-2 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium">
                  <Sparkles className="size-3.5 shrink-0" />
                  <span>Tư vấn phân tích đa chiều từ Hệ thống Multi-Agent Luật sư</span>
                </div>
              )}
              <MessageContent
                content={message.content}
                citations={message.citations}
                onSelectCitation={onSelectCitation}
              />

              {/* Citations section if provided */}
              {message.citations && message.citations.length > 0 && (
                <div className="border-border/60 mt-4 border-t pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                      <Scale className="text-primary size-3.5" />
                      <span>Căn cứ pháp lý viện dẫn</span>
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 py-0 text-[10px] font-normal"
                      >
                        {message.citations.length}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-[10px]">
                      Bấm vào để xem toàn văn trích đoạn
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {message.citations.map((citation) => (
                      <CitationCard
                        key={citation.id || `cit-${citation.index}`}
                        citation={citation}
                        onSelect={onSelectCitation}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        {!isEditing && (
          <div className="flex items-center gap-1 opacity-80 transition-opacity hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              onClick={handleCopy}
              title="Sao chép nội dung"
              aria-label="Sao chép nội dung"
            >
              {copied ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>

            {isUser && (onEditInPlace || onEditMessage) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground h-6 w-6"
                onClick={() => setIsEditing(true)}
                title="Sửa tin nhắn"
                aria-label="Sửa tin nhắn"
              >
                <Pencil className="size-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
