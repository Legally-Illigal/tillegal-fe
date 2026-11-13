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

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
  silent401?: boolean
}

export interface UploadRequestOptions extends Omit<RequestOptions, 'body' | 'method'> {
  onUploadProgress?: (percent: number) => void
}

export interface BlobResponse {
  blob: Blob
  fileName?: string
}

function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
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

  return url.toString()
}

function buildHeaders(
  headers: HeadersInit | undefined,
  options: { skipAuth?: boolean; isFormData?: boolean; accept?: string } = {},
): Record<string, string> {
  const reqHeaders: Record<string, string> = {
    ...(options.accept ? { Accept: options.accept } : {}),
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  }

  const token = tokenStorage.getAccessToken()
  if (token && !options.skipAuth) {
    reqHeaders.Authorization = `Bearer ${token}`
  }

  return reqHeaders
}

function handleUnauthorized(): void {
  tokenStorage.clearTokens()
  window.dispatchEvent(new CustomEvent('auth:unauthorized'))
}

function extractProblemError(
  problem: ProblemDetails,
  status: number,
  statusText?: string,
): ApiError {
  const rawCode =
    problem.code ||
    (typeof (problem as Record<string, unknown>).code === 'string'
      ? ((problem as Record<string, unknown>).code as string)
      : undefined) ||
    (typeof problem.extensions?.code === 'string'
      ? (problem.extensions.code as string)
      : undefined)

  if (rawCode && !problem.code) {
    problem.code = rawCode
  }

  const firstValidationError = problem.errors
    ? Object.values(problem.errors).flat()[0]
    : null
  const errorMsg =
    firstValidationError ||
    (problem.detail && problem.detail !== 'Review the errors and try again.'
      ? problem.detail
      : null) ||
    problem.title ||
    statusText ||
    'Yêu cầu xử lý không thành công'

  return new ApiError(errorMsg, status, problem)
}

function parseFileNameFromDisposition(disposition: string | null): string | undefined {
  if (!disposition) return undefined

  const utf8Match = /filename\*=UTF-8''([^;\n]+)/i.exec(disposition)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      return utf8Match[1].trim()
    }
  }

  const plainMatch = /filename="?([^";\n]+)"?/i.exec(disposition)
  return plainMatch?.[1]?.trim() || undefined
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, skipAuth, headers, ...customConfig } = options
  const isFormData = customConfig.body instanceof FormData

  const config: RequestInit = {
    credentials: 'include', // Automatically send cookies (e.g. access_token cookie set by backend)
    ...customConfig,
    headers: buildHeaders(headers, {
      skipAuth,
      isFormData,
      accept: 'application/json',
    }),
  }

  try {
    const response = await fetch(buildUrl(endpoint, params), config)

    if (response.status === 204) {
      return undefined as T
    }

    if (response.status === 401 && !options.silent401) {
      handleUnauthorized()
    }

    if (!response.ok) {
      const problem = (await response.json().catch(() => ({}))) as ProblemDetails
      throw extractProblemError(problem, response.status, response.statusText)
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

function uploadFormWithProgress<T>(
  endpoint: string,
  formData: FormData,
  options: UploadRequestOptions,
): Promise<T> {
  const { params, skipAuth, headers, onUploadProgress } = options
  const url = buildUrl(endpoint, params)
  const reqHeaders = buildHeaders(headers, {
    skipAuth,
    isFormData: true,
    accept: 'application/json',
  })

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.withCredentials = true

    Object.entries(reqHeaders).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    if (onUploadProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status === 401) {
        handleUnauthorized()
      }

      if (xhr.status === 204) {
        resolve(undefined as T)
        return
      }

      let parsedBody: unknown = {}
      if (xhr.responseText) {
        try {
          parsedBody = JSON.parse(xhr.responseText)
        } catch {
          parsedBody = {}
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(parsedBody as T)
        return
      }

      reject(
        extractProblemError(parsedBody as ProblemDetails, xhr.status, xhr.statusText),
      )
    }

    xhr.onerror = () => {
      reject(new ApiError('Lỗi kết nối máy chủ', 500))
    }

    xhr.onabort = () => {
      reject(new ApiError('Đã hủy tải tệp lên', 499))
    }

    xhr.send(formData)
  })
}

async function getBlob(
  endpoint: string,
  options: RequestOptions = {},
): Promise<BlobResponse> {
  const { params, skipAuth, headers, ...customConfig } = options

  try {
    const response = await fetch(buildUrl(endpoint, params), {
      credentials: 'include',
      ...customConfig,
      method: 'GET',
      headers: buildHeaders(headers, {
        skipAuth,
        isFormData: true,
      }),
    })

    if (response.status === 401 && !options.silent401) {
      handleUnauthorized()
    }

    if (!response.ok) {
      const problem = (await response.json().catch(() => ({}))) as ProblemDetails
      throw extractProblemError(problem, response.status, response.statusText)
    }

    const blob = await response.blob()
    const fileName = parseFileNameFromDisposition(
      response.headers.get('content-disposition'),
    )
    return { blob, fileName }
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

  postForm: <T>(endpoint: string, formData: FormData, options?: UploadRequestOptions) => {
    if (options?.onUploadProgress && typeof XMLHttpRequest !== 'undefined') {
      return uploadFormWithProgress<T>(endpoint, formData, options)
    }
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
    })
  },

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  getBlob,
}
