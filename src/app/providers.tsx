import { StrictMode, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import i18n from '@/lib/i18n'

/** Wraps the app with every cross-cutting provider in one place. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
        </TooltipProvider>
      </ThemeProvider>
    </StrictMode>
  )
}
