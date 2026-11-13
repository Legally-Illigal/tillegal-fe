import {
  FolderOpen,
  Home,
  Loader2,
  MessageSquare,
  Plus,
  Scale,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Conversation } from '../types/chat.types'

export interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onDelete: (id: string) => void
  onOpenAttachments?: () => void
  attachmentsCount?: number
  isUploadingAttachment?: boolean
  className?: string
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onOpenAttachments,
  attachmentsCount = 0,
  isUploadingAttachment = false,
  className,
}: ChatSidebarProps) {
  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div
      className={cn(
        'border-border/80 bg-sidebar text-sidebar-foreground flex h-full w-64 flex-col border-r',
        className,
      )}
    >
      {/* Sidebar Header */}
      <div className="border-border/60 border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <Link
            to="/"
            className="text-foreground flex items-center gap-2 font-bold transition-opacity hover:opacity-80"
          >
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg shadow-xs">
              <Scale className="size-4" />
            </div>
            <span className="text-sm font-extrabold tracking-tight">Tillegal</span>
          </Link>
          <Link to="/" title="Về trang chủ">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="size-4" />
            </Button>
          </Link>
        </div>

        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 text-xs font-semibold shadow-xs"
          size="sm"
        >
          <Plus className="size-4" />
          <span>Cuộc trò chuyện mới</span>
        </Button>

        {onOpenAttachments && (
          <Button
            type="button"
            variant="outline"
            onClick={onOpenAttachments}
            className="mt-2 w-full justify-between text-xs font-medium"
            size="sm"
          >
            <span className="flex items-center gap-2">
              {isUploadingAttachment ? (
                <Loader2 className="text-primary size-4 animate-spin" />
              ) : (
                <FolderOpen className="text-primary size-4" />
              )}
              <span>Quản lý tài liệu</span>
            </span>
            {attachmentsCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary px-1.5 py-0 text-[10px]"
              >
                {attachmentsCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Conversation List */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">
          Lịch sử hỏi đáp ({conversations.length})
        </div>

        <ScrollArea className="flex-1 px-2">
          {conversations.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-xs">
              Chưa có cuộc trò chuyện nào. Bấm nút phía trên để bắt đầu!
            </div>
          ) : (
            <div className="space-y-1 py-1">
              {conversations.map((c) => {
                const isActive = c.id === activeId
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    )}
                    onClick={() => onSelect(c.id)}
                  >
                    <div className="mr-2 flex min-w-0 flex-1 items-center gap-2">
                      <MessageSquare
                        className={cn(
                          'size-3.5 shrink-0',
                          isActive ? 'text-primary' : 'text-muted-foreground',
                        )}
                      />
                      <span className="truncate">{c.title || 'Cuộc trò chuyện mới'}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {c.createdAt && (
                        <span className="text-muted-foreground text-[10px] group-hover:hidden">
                          {formatDate(c.createdAt)}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive hidden h-5 w-5 group-hover:flex"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(c.id)
                        }}
                        title="Xóa hội thoại"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
