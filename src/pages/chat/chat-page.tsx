import {
  Bot,
  Check,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Pencil,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth'
import {
  AttachmentDrawer,
  ChatInput,
  ChatSidebar,
  LegalDisclaimer,
  MessageList,
  useChat,
} from '@/features/chat'
import { CitationDrawer } from '@/features/citation'

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false)
  const [isAttachmentDrawerOpen, setIsAttachmentDrawerOpen] = React.useState(false)
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = React.useState(false)
  const [headerTitle, setHeaderTitle] = React.useState('')
  const [isConfirmingDeleteHeader, setIsConfirmingDeleteHeader] = React.useState(false)

  const {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    attachments,
    isAttachmentsLoading,
    uploadTasks,
    isUploadingAttachment,
    deletingAttachmentIds,
    downloadingAttachmentId,
    isLoading,
    isLawyer,
    selectedCitation,
    isCitationDrawerOpen,
    setIsCitationDrawerOpen,
    selectCitation,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
    editMessage,
    editMessageInPlace,
    switchMessageBranch,
    uploadAttachments,
    refreshAttachments,
    refreshAttachmentDetail,
    deleteAttachment,
    downloadAttachment,
    dismissUploadTask,
    clearFailedUploadTasks,
  } = useChat()

  React.useEffect(() => {
    if (activeConversation) {
      setHeaderTitle(activeConversation.title)
    }
    setIsEditingHeaderTitle(false)
  }, [activeConversationId, activeConversation])

  // Xử lý query param `?q=...` truyền từ Trang Chủ
  const initialQueryHandled = React.useRef(false)
  React.useEffect(() => {
    const query = searchParams.get('q')
    if (query && !initialQueryHandled.current) {
      initialQueryHandled.current = true
      // Xóa query param khỏi URL để không gửi lặp lại khi refresh
      setSearchParams({}, { replace: true })
      sendMessage(query)
    }
  }, [searchParams, setSearchParams, sendMessage])

  const userInitial = user
    ? user.fullName
      ? user.fullName.split(' ').pop()?.slice(0, 2).toUpperCase()
      : user.email.slice(0, 2).toUpperCase()
    : 'ND'

  return (
    <div className="bg-background flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={`hidden transition-all duration-200 ease-in-out md:flex ${
          isSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-72 shrink-0'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => selectConversation(id)}
          onNewChat={createNewChat}
          onDelete={deleteConversation}
          onRename={updateConversationTitle}
          onOpenAttachments={() => setIsAttachmentDrawerOpen(true)}
          attachmentsCount={attachments.length}
          isUploadingAttachment={isUploadingAttachment}
          className="w-full"
        />
      </aside>

      {/* Main Chat Column */}
      <main className="bg-background/50 flex h-full min-w-0 flex-1 flex-col">
        {/* Chat Sub-header */}
        <div className="border-border/60 flex h-12 items-center justify-between border-b px-4">
          <div className="flex min-w-0 items-center gap-2">
            {/* Desktop Sidebar Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="text-muted-foreground hover:text-foreground hidden md:flex"
              title={isSidebarCollapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>

            {/* Mobile Sidebar Trigger */}
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground md:hidden"
                  title="Danh sách hội thoại"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <ChatSidebar
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={(id) => {
                    selectConversation(id)
                    setIsMobileSidebarOpen(false)
                  }}
                  onNewChat={() => {
                    createNewChat()
                    setIsMobileSidebarOpen(false)
                  }}
                  onDelete={deleteConversation}
                  onRename={updateConversationTitle}
                  onOpenAttachments={() => {
                    setIsMobileSidebarOpen(false)
                    setIsAttachmentDrawerOpen(true)
                  }}
                  attachmentsCount={attachments.length}
                  isUploadingAttachment={isUploadingAttachment}
                  className="h-full w-full border-r-0"
                />
              </SheetContent>
            </Sheet>

            {activeConversation && isEditingHeaderTitle ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = headerTitle.trim()
                      if (trimmed) {
                        void updateConversationTitle(activeConversation.id, trimmed)
                      }
                      setIsEditingHeaderTitle(false)
                    }
                    if (e.key === 'Escape') setIsEditingHeaderTitle(false)
                  }}
                  autoFocus
                  className="h-7 w-44 border-zinc-300 bg-white text-xs text-black sm:w-64 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="Tiêu đề cuộc trò chuyện..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                  onClick={() => {
                    const trimmed = headerTitle.trim()
                    if (trimmed) {
                      void updateConversationTitle(activeConversation.id, trimmed)
                    }
                    setIsEditingHeaderTitle(false)
                  }}
                  title="Lưu tiêu đề"
                >
                  <Check className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-foreground h-7 w-7"
                  onClick={() => setIsEditingHeaderTitle(false)}
                  title="Hủy"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 truncate">
                <Scale className="text-primary size-4 shrink-0" />
                <h2 className="text-foreground truncate text-xs font-semibold sm:text-sm">
                  {activeConversation?.title || 'Tư vấn pháp lý mới'}
                </h2>
                {isLawyer ? (
                  <Badge
                    variant="outline"
                    className="border-primary/40 bg-primary/10 text-primary hidden items-center gap-1 px-2 py-0.5 text-[11px] font-medium sm:inline-flex"
                    title="Chế độ Multi-Agent: Hệ thống phối hợp các chuyên gia AI phân tích chuyên sâu dành cho Luật sư"
                  >
                    <Sparkles className="text-primary size-3 animate-pulse" />
                    <span>Chế độ Multi-Agent</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-muted bg-muted/40 text-muted-foreground hidden items-center gap-1 px-2 py-0.5 text-[11px] font-medium sm:inline-flex"
                  >
                    <Bot className="size-3" />
                    <span>Trợ lý AI Tiêu chuẩn</span>
                  </Badge>
                )}
                {activeConversation && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setHeaderTitle(activeConversation.title)
                        setIsEditingHeaderTitle(true)
                      }}
                      className="text-muted-foreground hover:text-foreground h-6 w-6"
                      title="Đổi tiêu đề hội thoại"
                      aria-label="Đổi tiêu đề hội thoại"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsConfirmingDeleteHeader(true)}
                      className="text-muted-foreground hover:text-destructive h-6 w-6"
                      title="Xóa cuộc trò chuyện này"
                      aria-label="Xóa cuộc trò chuyện này"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAttachmentDrawerOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <Paperclip className="size-3.5" />
              <span className="hidden sm:inline">Tài liệu</span>
              {(attachments.length > 0 || isUploadingAttachment) && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary px-1.5 py-0 text-[10px]"
                >
                  {attachments.length}
                </Badge>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={createNewChat}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Hội thoại mới</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onSelectCitation={selectCitation}
            onSelectScenario={sendMessage}
            onEditMessage={editMessage}
            onEditInPlace={editMessageInPlace}
            onSwitchBranch={switchMessageBranch}
            userInitial={userInitial}
            isLawyer={isLawyer}
          />
        </div>

        {/* Docked Chat Input Bar */}
        <div className="border-border/40 bg-background/80 border-t pt-3 pb-2 backdrop-blur-xs">
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            attachments={attachments}
            uploadTasks={uploadTasks}
            isUploadingAttachment={isUploadingAttachment}
            onUploadFiles={uploadAttachments}
            onOpenAttachments={() => setIsAttachmentDrawerOpen(true)}
            onDeleteAttachment={deleteAttachment}
            isLawyer={isLawyer}
          />
          <LegalDisclaimer />
        </div>
      </main>

      {/* Citation Slide-over Drawer */}
      <CitationDrawer
        citation={selectedCitation}
        open={isCitationDrawerOpen}
        onOpenChange={setIsCitationDrawerOpen}
      />

      {/* Conversation Attachments Drawer */}
      <AttachmentDrawer
        open={isAttachmentDrawerOpen}
        onOpenChange={setIsAttachmentDrawerOpen}
        attachments={attachments}
        isLoading={isAttachmentsLoading}
        uploadTasks={uploadTasks}
        deletingIds={deletingAttachmentIds}
        downloadingId={downloadingAttachmentId}
        onUploadFiles={uploadAttachments}
        onRefresh={refreshAttachments}
        onRefreshDetail={refreshAttachmentDetail}
        onDelete={deleteAttachment}
        onDownload={downloadAttachment}
        onDismissUploadTask={dismissUploadTask}
        onClearFailedUploadTasks={clearFailedUploadTasks}
      />

      {/* Confirmation Dialog on Delete Active Conversation from Header */}
      <Dialog open={isConfirmingDeleteHeader} onOpenChange={setIsConfirmingDeleteHeader}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa cuộc trò chuyện</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện &ldquo;
              <span className="text-foreground font-semibold">
                {activeConversation?.title || 'Tư vấn pháp lý mới'}
              </span>
              &rdquo;? Thao tác này sẽ xóa vĩnh viễn đoạn hội thoại này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmingDeleteHeader(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                if (activeConversation) {
                  await deleteConversation(activeConversation.id)
                }
                setIsConfirmingDeleteHeader(false)
              }}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
