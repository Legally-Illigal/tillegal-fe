import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Scale } from 'lucide-react'
import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth'
import {
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

  const {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    isLoading,
    selectedCitation,
    isCitationDrawerOpen,
    setIsCitationDrawerOpen,
    selectCitation,
    sendMessage,
    createNewChat,
    selectConversation,
    deleteConversation,
  } = useChat()

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
          isSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-72'
        }`}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={(id) => selectConversation(id)}
          onNewChat={createNewChat}
          onDelete={deleteConversation}
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
                  className="h-full w-full border-r-0"
                />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 truncate">
              <Scale className="text-primary size-4 shrink-0" />
              <h2 className="text-foreground truncate text-xs font-semibold sm:text-sm">
                {activeConversation?.title || 'Tư vấn pháp lý mới'}
              </h2>
            </div>
          </div>

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

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onSelectCitation={selectCitation}
            onSelectScenario={sendMessage}
            userInitial={userInitial}
          />
        </div>

        {/* Docked Chat Input Bar */}
        <div className="border-border/40 bg-background/80 border-t pt-3 pb-2 backdrop-blur-xs">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
          <LegalDisclaimer />
        </div>
      </main>

      {/* Citation Slide-over Drawer */}
      <CitationDrawer
        citation={selectedCitation}
        open={isCitationDrawerOpen}
        onOpenChange={setIsCitationDrawerOpen}
      />
    </div>
  )
}
