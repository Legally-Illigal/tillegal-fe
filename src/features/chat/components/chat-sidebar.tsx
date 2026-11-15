<<<<<<< Updated upstream
import { Home, MessageSquare, Plus, Scale, Trash2 } from 'lucide-react'
=======
import {
  Check,
  FolderOpen,
  Home,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Scale,
  Trash2,
  X,
} from 'lucide-react'
import * as React from 'react'
>>>>>>> Stashed changes
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Conversation } from '../types/chat.types'

export interface ChatSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onDelete: (id: string) => void
<<<<<<< Updated upstream
=======
  onRename?: (id: string, newTitle: string) => void | Promise<void>
  onOpenAttachments?: () => void
  attachmentsCount?: number
  isUploadingAttachment?: boolean
>>>>>>> Stashed changes
  className?: string
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
<<<<<<< Updated upstream
=======
  onRename,
  onOpenAttachments,
  attachmentsCount = 0,
  isUploadingAttachment = false,
>>>>>>> Stashed changes
  className,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingTitle, setEditingTitle] = React.useState('')
  const [deletingConversation, setDeletingConversation] =
    React.useState<Conversation | null>(null)

  const formatDate = (isoString?: string) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })
    } catch {
      return ''
    }
  }

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(c.id)
    setEditingTitle(c.title || '')
  }

  const handleSaveRename = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    const trimmed = editingTitle.trim()
    if (trimmed && onRename) {
      void onRename(id, trimmed)
    }
    setEditingId(null)
  }

  const handleCancelRename = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    setEditingId(null)
  }

  const handleOpenDelete = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingConversation(c)
  }

  const handleConfirmDelete = () => {
    if (deletingConversation) {
      onDelete(deletingConversation.id)
      setDeletingConversation(null)
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
      </div>

      {/* Conversation List */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="text-muted-foreground px-4 pt-3 pb-1 text-[11px] font-semibold tracking-wider uppercase">
          Lịch sử hỏi đáp ({conversations.length})
        </div>

        <ScrollArea className="flex-1 px-2 [&>div>div]:!block">
          {conversations.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-xs">
              Chưa có cuộc trò chuyện nào. Bấm nút phía trên để bắt đầu!
            </div>
          ) : (
            <div className="w-full min-w-0 space-y-1 py-1">
              {conversations.map((c) => {
                const isActive = c.id === activeId
                const isEditing = c.id === editingId

                return (
                  <div
                    key={c.id}
                    className={cn(
                      'group relative flex w-full min-w-0 cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                    )}
                    onClick={() => {
                      if (!isEditing) onSelect(c.id)
                    }}
                  >
                    {isEditing ? (
                      <div
                        className="flex w-full items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(c.id, e)
                            if (e.key === 'Escape') handleCancelRename(e)
                          }}
                          className="h-7 border-zinc-300 bg-white px-2 text-xs text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          placeholder="Tiêu đề cuộc trò chuyện..."
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                          onClick={(e) => handleSaveRename(c.id, e)}
                          title="Lưu tiêu đề"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground h-7 w-7"
                          onClick={(e) => handleCancelRename(e)}
                          title="Hủy"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mr-2 flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                          <MessageSquare
                            className={cn(
                              'size-3.5 shrink-0',
                              isActive ? 'text-primary' : 'text-muted-foreground',
                            )}
                          />
                          <span className="truncate">
                            {c.title || 'Cuộc trò chuyện mới'}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {c.createdAt && (
                            <span
                              className={cn(
                                'text-muted-foreground hidden text-[10px] xl:inline',
                                isActive ? 'hidden' : 'group-hover:hidden',
                              )}
                            >
                              {formatDate(c.createdAt)}
                            </span>
                          )}
                          <div
                            className={cn(
                              'flex shrink-0 items-center gap-0.5 transition-opacity',
                              isActive
                                ? 'opacity-100'
                                : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
                            )}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground h-6 w-6"
                              onClick={(e) => handleStartRename(c, e)}
                              title="Sửa tiêu đề"
                              aria-label="Sửa tiêu đề"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="h-6 w-6 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                              onClick={(e) => handleOpenDelete(c, e)}
                              title="Xóa cuộc trò chuyện"
                              aria-label="Xóa hội thoại"
                            >
                              <Trash2 className="size-3.5 text-rose-500 dark:text-rose-400" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Confirmation Dialog on Delete */}
      <Dialog
        open={Boolean(deletingConversation)}
        onOpenChange={(open) => {
          if (!open) setDeletingConversation(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa cuộc trò chuyện</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện &ldquo;
              <span className="text-foreground font-semibold">
                {deletingConversation?.title || 'Cuộc trò chuyện mới'}
              </span>
              &rdquo;? Thao tác này sẽ xóa vĩnh viễn đoạn hội thoại này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingConversation(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
