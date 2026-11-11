import { AlertCircle, Scale } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-border/60 bg-muted/30 w-full border-t">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Mandatory Legal Disclaimer according to ADR-004 & UI/UX principles */}
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold">{t('footer.disclaimerTitle')}</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed dark:text-amber-200/80">
                {t('footer.disclaimer')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-xs sm:flex-row">
          <div className="flex items-center gap-2">
            <Scale className="text-primary size-4" />
            <span className="text-foreground font-medium">Tillegal</span>
            <span>—</span>
            <span>{t('app.tagline')}</span>
          </div>
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
