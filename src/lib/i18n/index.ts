import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { env } from '@/config/env'
import vi from './locales/vi.json'

export const resources = {
  vi: { translation: vi },
} as const

export const supportedLocales = Object.keys(resources) as Array<keyof typeof resources>

void i18n.use(initReactI18next).init({
  resources,
  lng: env.defaultLocale,
  fallbackLng: env.defaultLocale,
  supportedLngs: supportedLocales,
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n
