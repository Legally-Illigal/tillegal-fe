import { HelpCircle, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SAMPLE_VERIFICATION_SCENARIOS } from '../api/verification-api'
import type { SampleVerificationScenario } from '../types/verification.types'

export interface VerificationSampleSelectorProps {
  onSelect: (scenario: SampleVerificationScenario) => void
  disabled?: boolean
}

export function VerificationSampleSelector({
  onSelect,
  disabled = false,
}: VerificationSampleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold">
        <Sparkles className="text-primary size-3.5" />
        <span>Tình huống mẫu thẩm định nhanh:</span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLE_VERIFICATION_SCENARIOS.map((scenario) => (
          <Card
            key={scenario.id}
            onClick={() => !disabled && onSelect(scenario)}
            className="group border-border/70 hover:border-primary/50 bg-card cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xs"
          >
            <CardContent className="flex h-full flex-col justify-between p-3.5">
              <div>
                <Badge variant="secondary" className="mb-1.5 text-[10px] font-normal">
                  {scenario.tag}
                </Badge>
                <p className="text-foreground group-hover:text-primary line-clamp-2 text-xs leading-snug font-semibold transition-colors">
                  {scenario.title}
                </p>
              </div>

              <div className="text-muted-foreground group-hover:text-primary mt-3 flex items-center gap-1 text-[11px] transition-colors">
                <HelpCircle className="size-3" />
                <span>Thẩm định tình huống này</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
