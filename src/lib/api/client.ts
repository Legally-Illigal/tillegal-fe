import { env } from '@/config/env'
import { ApiError, type ProblemDetails } from './types'

const ACCESS_TOKEN_KEY = 'tillegal_access_token'

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth, headers = {}, ...customConfig } = options

  // Construct URL
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${env.apiBaseUrl}${endpoint}`,
    window.location.origin,
  )

  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) {
        url.searchParams.append(key, String(val))
      }
    })
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  }

  const token = tokenStorage.getAccessToken()
  if (token && !skipAuth) {
    reqHeaders.Authorization = `Bearer ${token}`
  }

  const config: RequestInit = {
    credentials: 'include', // Automatically send cookies (e.g. access_token cookie set by backend)
    ...customConfig,
    headers: reqHeaders,
  }

  try {
    const response = await fetch(url.toString(), config)

    if (response.status === 204) {
      return undefined as T
    }

    if (response.status === 401) {
      tokenStorage.clearTokens()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    if (!response.ok) {
      const problem = (await response.json().catch(() => ({}))) as ProblemDetails
      const firstValidationError = problem.errors
        ? Object.values(problem.errors).flat()[0]
        : null
      const errorMsg =
        firstValidationError ||
        (problem.detail && problem.detail !== 'Review the errors and try again.'
          ? problem.detail
          : null) ||
        problem.title ||
        response.statusText ||
        'Yêu cầu xử lý không thành công'

      throw new ApiError(errorMsg, response.status, problem)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    const err = error as Error
    throw new ApiError(err.message || 'Lỗi kết nối máy chủ', 500)
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
