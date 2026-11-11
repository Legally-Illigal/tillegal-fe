import { Bot, HelpCircle, Loader2, Scale, Sparkles } from 'lucide-react'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CitationItem } from '@/features/citation'
import type { ConversationMessage } from '../types/chat.types'
import { MessageItem } from './message-item'

export interface MessageListProps {
  messages: ConversationMessage[]
  isLoading: boolean
  onSelectCitation?: (citation: CitationItem) => void
  onSelectScenario?: (query: string) => void
  userInitial?: string
}

const DEFAULT_SUGGESTIONS = [
  {
    tag: 'Đất đai & Nhà ở',
    query: 'Thủ tục cấp đổi sổ đỏ và điều kiện thừa kế đất đai theo Luật Đất đai 2024?',
  },
  {
    tag: 'Lao động & Việc làm',
    query: 'Doanh nghiệp sa thải nhân viên không báo trước cần bồi thường những gì?',
  },
  {
    tag: 'Doanh nghiệp & Hợp đồng',
    query:
      'Thủ tục thay đổi người đại diện theo pháp luật của công ty TNHH một thành viên?',
  },
  {
    tag: 'Giao thông & Vi phạm',
    query: 'Mức phạt vi phạm nồng độ cồn khi điều khiển xe máy theo quy định mới nhất?',
  },
]

export function MessageList({
  messages,
  isLoading,
  onSelectCitation,
  onSelectScenario,
  userInitial,
}: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const safeMessages = React.useMemo(() => {
    if (!Array.isArray(messages)) return []
    return messages.filter((m): m is ConversationMessage =>
      Boolean(m && typeof m === 'object' && m.id),
    )
  }, [messages])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [safeMessages, isLoading])

  if (safeMessages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center sm:p-8">
        <div className="bg-primary/10 border-primary/20 mb-4 flex size-14 items-center justify-center rounded-2xl border shadow-xs">
          <Scale className="text-primary size-7" />
        </div>

        <h3 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          Trợ lý AI Pháp luật Việt Nam
        </h3>
        <p className="text-muted-foreground mt-2 max-w-md text-xs leading-relaxed sm:text-sm">
          Tra cứu quy định, giải đáp tình huống và đối chiếu điều khoản văn bản quy phạm
          pháp luật minh bạch, chính xác.
        </p>

        <div className="mt-8 w-full max-w-2xl">
          <div className="text-muted-foreground mb-3 flex items-center justify-center gap-1.5 text-xs font-medium">
            <Sparkles className="text-primary size-3.5" />
            <span>Tình huống gợi ý phổ biến:</span>
          </div>

          <div className="grid gap-2.5 text-left sm:grid-cols-2">
            {DEFAULT_SUGGESTIONS.map((item, idx) => (
              <Card
                key={idx}
                onClick={() => onSelectScenario?.(item.query)}
                className="group border-border/70 hover:border-primary/50 bg-card cursor-pointer transition-all hover:shadow-xs"
              >
                <CardContent className="flex h-full flex-col justify-between p-3.5">
                  <div>
                    <Badge variant="secondary" className="mb-1.5 text-[10px] font-normal">
                      {item.tag}
                    </Badge>
                    <p className="text-foreground group-hover:text-primary text-xs leading-snug font-medium transition-colors">
                      {item.query}
                    </p>
                  </div>
                  <div className="text-muted-foreground group-hover:text-primary mt-2 flex items-center gap-1 text-[11px]">
                    <HelpCircle className="size-3" />
                    <span>Hỏi tình huống này</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-2 p-4 sm:p-6">
      {safeMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onSelectCitation={onSelectCitation}
          userInitial={userInitial}
        />
      ))}

      {/* Typing / Loading indicator */}
      {isLoading && (
        <div className="flex w-full gap-3 py-4">
          <div className="ring-border bg-card text-foreground flex size-8 shrink-0 items-center justify-center rounded-full shadow-xs ring-1">
            <Bot className="text-primary size-4 animate-pulse" />
          </div>

          <div className="flex max-w-[80%] flex-col gap-1">
            <div className="text-muted-foreground flex items-center gap-2 px-1 text-[11px]">
              <span className="font-medium">Trợ lý Tillegal AI</span>
              <span>• Đang xử lý...</span>
            </div>

            <div className="border-border/80 bg-card rounded-2xl rounded-tl-xs border p-4 shadow-xs">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="text-primary size-4 animate-spin" />
                <span>
                  Đang tra cứu cơ sở dữ liệu luật & phân tích căn cứ điều khoản...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  )
}
