export interface AdminUser {
  id: string
  fullName: string | null
  email: string | null
  phoneNumber: string | null
  roleName: string | null
  isActive: boolean
  createdAt: string
  lastActiveAt: string | null
}

export interface PagedAdminUsersResponse {
  items: AdminUser[] | null
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface GetAdminUsersParams {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
}

export interface UpdateUserStatusRequest {
  isActive: boolean
}

export interface AiEvaluation {
  id: string
  messageId: string
  evaluatorUserId: string | null
  evaluatorRole: string | null
  isHelpful: boolean | null
  rating: number | null
  feedbackComment: string | null
  createdAt: string
  updatedAt: string | null
}

export interface AiEvaluationSummary {
  totalEvaluations: number
  helpfulCount: number
  unhelpfulCount: number
  averageRating: number
  lawyerEvaluationsCount: number
  userEvaluationsCount: number
  ratingDistribution: Record<string, number> | null
}

export interface PagedAiEvaluationsResponse {
  items: AiEvaluation[] | null
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface GetAiEvaluationsParams {
  pageNumber?: number
  pageSize?: number
  isHelpful?: boolean
  rating?: number
  evaluatorUserId?: string
  evaluatorRole?: string
}
