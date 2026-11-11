import { Bot, Check, Copy, Scale, User } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CitationCard, type CitationItem } from '@/features/citation'
import { cn } from '@/lib/utils'
import type { ConversationMessage } from '../types/chat.types'
import { MessageContent } from './message-content'

export interface MessageItemProps {
  message: ConversationMessage
  onSelectCitation?: (citation: CitationItem) => void
  userInitial?: string
}

export function MessageItem({
  message,
  onSelectCitation,
  userInitial = 'ND',
}: MessageItemProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = React.useState(false)

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
          <span className="font-medium">{isUser ? 'Bạn' : 'Trợ lý Tillegal AI'}</span>
          {message.createdAt && <span>• {formatTime(message.createdAt)}</span>}
        </div>

        {/* Content Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-xs',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-xs'
              : 'bg-card border-border/80 text-foreground rounded-tl-xs border',
          )}
        >
          {isUser ? (
            <p className="text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
              {message.content}
            </p>
          ) : (
            <div className="space-y-4">
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
        {!isUser && (
          <div className="flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              onClick={handleCopy}
              title="Sao chép nội dung"
            >
              {copied ? (
                <Check className="size-3 text-emerald-600" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
