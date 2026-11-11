import * as React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  type CitationItem,
  getCitationDisplayTitle,
  getCitationReference,
} from '../types/citation.types'

export interface CitationBadgeProps {
  citation: CitationItem
  onClick?: (citation: CitationItem) => void
  className?: string
}

export function CitationBadge({ citation, onClick, className }: CitationBadgeProps) {
  const title = getCitationDisplayTitle(citation)
  const reference = getCitationReference(citation)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(citation)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground focus-visible:ring-ring inline-flex h-4.5 min-w-4.5 cursor-pointer items-center justify-center rounded-sm border px-1 align-super text-[10px] font-semibold transition-all focus-visible:ring-1 focus-visible:outline-none',
              className,
            )}
            aria-label={`Trích dẫn ${citation.index}: ${title}`}
          >
            {citation.index}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-semibold">{title}</p>
          {reference && (
            <p className="text-muted-foreground mt-0.5 text-[11px]">{reference}</p>
          )}
          <p className="text-primary-foreground/70 mt-1 text-[10px] italic">
            Nhấn để xem toàn văn trích dẫn
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
