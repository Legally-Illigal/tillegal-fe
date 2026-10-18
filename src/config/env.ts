/**
 * Centralized, typed access to runtime configuration.
 * Never read `import.meta.env` directly elsewhere — import from here so every
 * env dependency is discoverable and defaults live in one place.
 */
export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'React Base',
  defaultLocale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'en',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

export type AppEnv = typeof env
