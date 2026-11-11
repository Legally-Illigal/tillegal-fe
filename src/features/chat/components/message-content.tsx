import * as React from 'react'
import { CitationBadge, type CitationItem } from '@/features/citation'

export interface MessageContentProps {
  content: string
  citations?: CitationItem[] | null
  onSelectCitation?: (citation: CitationItem) => void
}

/**
 * Phân tích và render một dòng văn bản chứa các định dạng inline (bold, code, trích dẫn [^1] / [1])
 */
function renderInlineContent(
  text: string,
  citations?: CitationItem[] | null,
  onSelectCitation?: (citation: CitationItem) => void,
  keyPrefix = 'inline',
): React.ReactNode[] {
  // Regex khớp với:
  // 1. Trích dẫn dạng [^1] hoặc [1]
  // 2. Bold text dạng **text**
  // 3. Inline code `text`
  const tokenRegex = /(\[\^?\d+\]|\*\*[^*]+\*\*|`[^`]+`)/g
  const parts = text.split(tokenRegex)

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`

    // Khớp trích dẫn dạng [^1] hoặc [1]
    const citationMatch = part.match(/^\[\^?(\d+)\]$/)
    if (citationMatch && citationMatch[1]) {
      const citationIndex = parseInt(citationMatch[1], 10)
      const foundCitation = citations?.find((c) => c.index === citationIndex)

      if (foundCitation) {
        return (
          <CitationBadge
            key={key}
            citation={foundCitation}
            onClick={onSelectCitation}
            className="mx-0.5"
          />
        )
      }

      // Nếu không tìm thấy object trích dẫn chi tiết trong mảng, hiển thị badge fallback
      const fallbackCitation: CitationItem = {
        index: citationIndex,
        title: `Căn cứ [${citationIndex}]`,
      }
      return (
        <CitationBadge
          key={key}
          citation={fallbackCitation}
          onClick={onSelectCitation}
          className="mx-0.5"
        />
      )
    }

    // Khớp bold text **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={key} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }

    // Khớp inline code `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={key}
          className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

export function MessageContent({
  content,
  citations,
  onSelectCitation,
}: MessageContentProps) {
  // Tách nội dung theo từng dòng
  const lines = content.split('\n')

  return (
    <div className="text-foreground/90 space-y-2 font-sans text-xs leading-relaxed break-words sm:text-sm">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim()
        const lineKey = `line-${lineIdx}`

        // Dòng trống
        if (!trimmed) {
          return <div key={lineKey} className="h-2" />
        }

        // Header cấp 3 (### )
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={lineKey}
              className="text-foreground mt-3 mb-1 text-sm font-bold tracking-tight sm:text-base"
            >
              {renderInlineContent(
                trimmed.slice(4),
                citations,
                onSelectCitation,
                lineKey,
              )}
            </h4>
          )
        }

        // Header cấp 2 (## )
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={lineKey}
              className="text-foreground border-border/40 mt-4 mb-1.5 border-b pb-1 text-base font-bold tracking-tight sm:text-lg"
            >
              {renderInlineContent(
                trimmed.slice(3),
                citations,
                onSelectCitation,
                lineKey,
              )}
            </h3>
          )
        }

        // Header cấp 1 (# )
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={lineKey}
              className="text-foreground mt-4 mb-2 text-lg font-extrabold tracking-tight sm:text-xl"
            >
              {renderInlineContent(
                trimmed.slice(2),
                citations,
                onSelectCitation,
                lineKey,
              )}
            </h2>
          )
        }

        // Bullet list (- hoặc * )
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={lineKey} className="flex items-start gap-2 pl-2">
              <span className="text-primary bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
              <div className="flex-1">
                {renderInlineContent(
                  trimmed.slice(2),
                  citations,
                  onSelectCitation,
                  lineKey,
                )}
              </div>
            </div>
          )
        }

        // Numbered list (ví dụ: 1. , 2. )
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
        if (numberedMatch && numberedMatch[1] && numberedMatch[2]) {
          const num = numberedMatch[1]
          const rest = numberedMatch[2]
          return (
            <div key={lineKey} className="flex items-start gap-2 pl-2">
              <span className="text-primary mt-0.5 shrink-0 text-xs font-semibold">
                {num}.
              </span>
              <div className="flex-1">
                {renderInlineContent(rest, citations, onSelectCitation, lineKey)}
              </div>
            </div>
          )
        }

        // Đoạn văn thông thường
        return (
          <p key={lineKey}>
            {renderInlineContent(line, citations, onSelectCitation, lineKey)}
          </p>
        )
      })}
    </div>
  )
}
