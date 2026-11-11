/**
 * Centralized, typed access to runtime configuration.
 * Never read `import.meta.env` directly elsewhere — import from here so every
 * env dependency is discoverable and defaults live in one place.
 */
export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Tillegal',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'vi',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5063/api',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

export type AppEnv = typeof env
