import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import type {
  AdminUser,
  AiEvaluation,
  AiEvaluationSummary,
  GetAdminUsersParams,
  GetAiEvaluationsParams,
  PagedAdminUsersResponse,
  PagedAiEvaluationsResponse,
  UpdateUserStatusRequest,
} from '../types/admin.types'

export const adminApi = {
  /**
   * Lấy danh sách người dùng có phân trang và tìm kiếm
   */
  getUsers: (params?: GetAdminUsersParams): Promise<PagedAdminUsersResponse> => {
    const queryParams = params
      ? {
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
          searchTerm: params.searchTerm?.trim() || undefined,
        }
      : undefined

    return apiClient.get<PagedAdminUsersResponse>(API_ENDPOINTS.admin.users, {
      params: queryParams,
    })
  },

  /**
   * Lấy chi tiết một tài khoản người dùng theo ID
   */
  getUserById: (id: string): Promise<AdminUser> => {
    return apiClient.get<AdminUser>(API_ENDPOINTS.admin.userDetail(id))
  },

  /**
   * Cập nhật trạng thái hoạt động (khóa / mở khóa) tài khoản người dùng
   */
  updateUserStatus: (id: string, body: UpdateUserStatusRequest): Promise<AdminUser> => {
    return apiClient.put<AdminUser>(API_ENDPOINTS.admin.userStatus(id), body)
  },

  /**
   * Cấp quyền Luật sư (Lawyer) cho tài khoản người dùng
   */
  grantLawyer: (id: string): Promise<AdminUser> => {
    return apiClient.put<AdminUser>(API_ENDPOINTS.admin.grantLawyer(id))
  },

  /**
   * Lấy thống kê tổng hợp đánh giá chất lượng câu trả lời AI
   */
  getAiEvaluationsSummary: (): Promise<AiEvaluationSummary> => {
    return apiClient.get<AiEvaluationSummary>(API_ENDPOINTS.admin.aiEvaluationSummary)
  },

  /**
   * Lấy danh sách đánh giá AI có phân trang và bộ lọc
   */
  getAiEvaluations: (
    params?: GetAiEvaluationsParams,
  ): Promise<PagedAiEvaluationsResponse> => {
    const queryParams = params
      ? {
          pageNumber: params.pageNumber,
          pageSize: params.pageSize,
          isHelpful: params.isHelpful,
          rating: params.rating,
          evaluatorUserId: params.evaluatorUserId?.trim() || undefined,
          evaluatorRole: params.evaluatorRole?.trim() || undefined,
        }
      : undefined

    return apiClient.get<PagedAiEvaluationsResponse>(API_ENDPOINTS.admin.aiEvaluations, {
      params: queryParams,
    })
  },

  /**
   * Lấy chi tiết một đánh giá AI theo ID
   */
  getAiEvaluationById: (id: string): Promise<AiEvaluation> => {
    return apiClient.get<AiEvaluation>(API_ENDPOINTS.admin.aiEvaluationDetail(id))
  },
}
