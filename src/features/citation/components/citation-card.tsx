import { ExternalLink, FileText, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  type CitationItem,
  getCitationDisplayTitle,
  getCitationReference,
} from '../types/citation.types'

export interface CitationCardProps {
  citation: CitationItem
  onSelect?: (citation: CitationItem) => void
  className?: string
}

export function CitationCard({ citation, onSelect, className }: CitationCardProps) {
  const title = getCitationDisplayTitle(citation)
  const reference = getCitationReference(citation)

  return (
    <div
      className={cn(
        'group border-border/70 bg-card hover:border-primary/40 relative flex flex-col justify-between rounded-lg border p-3.5 text-xs transition-all hover:shadow-xs',
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary border-primary/20 inline-flex size-5 items-center justify-center rounded-full border text-[10px] font-bold">
              {citation.index}
            </span>
            <span className="text-foreground line-clamp-1 font-semibold">{title}</span>
          </div>

          {citation.articleReference && (
            <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
              <Scale className="mr-1 size-2.5" />
              {citation.articleReference}
            </Badge>
          )}
        </div>

        {reference && reference !== citation.articleReference && (
          <p className="text-muted-foreground mt-1 text-[11px] font-medium">
            {reference}
          </p>
        )}

        {citation.citedText && (
          <p className="text-muted-foreground/90 border-primary/30 mt-2 line-clamp-2 border-l-2 pl-2 text-[11px] leading-relaxed italic">
            &ldquo;{citation.citedText}&rdquo;
          </p>
        )}
      </div>

      <div className="border-border/40 mt-3 flex items-center justify-between border-t pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary h-7 px-2 text-[11px]"
          onClick={() => onSelect?.(citation)}
        >
          <FileText className="mr-1 size-3" />
          Xem toàn văn trích dẫn
        </Button>

        {citation.sourceUrl && (
          <a
            href={citation.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] transition-colors"
            title="Mở văn bản gốc"
          >
            <span>Văn bản gốc</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}
