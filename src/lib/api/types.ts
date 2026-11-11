export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  traceId?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  title?: string
  detail?: string
  traceId?: string
  errors?: Record<string, string[]>

  constructor(message: string, status = 500, problemDetails?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = problemDetails?.title
    this.detail = problemDetails?.detail
    this.traceId = problemDetails?.traceId
    this.errors = problemDetails?.errors
  }
}
