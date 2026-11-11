import { ArrowUp, Loader2, Sparkles } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
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
}: ChatInputProps) {
  const [content, setContent] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const isSubmittingRef = React.useRef(false)

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
        className="border-border/80 bg-background focus-within:border-primary/60 focus-within:ring-primary/20 relative rounded-2xl border p-2 shadow-xs transition-all focus-within:ring-2"
      >
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
          <span className="text-muted-foreground hidden text-[10px] sm:inline">
            Nhấn <kbd className="bg-muted rounded px-1 font-mono">Enter</kbd> để gửi,{' '}
            <kbd className="bg-muted rounded px-1 font-mono">Shift + Enter</kbd> để xuống
            dòng
          </span>

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
