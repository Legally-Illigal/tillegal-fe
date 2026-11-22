import type { ConversationMessage } from '../types/chat.types'

/**
 * Kiểm tra xem vai trò tài khoản có phải là Luật sư (Lawyer) hay không
 */
export function isLawyerRole(role?: string | null): boolean {
  if (!role) return false
  const lower = role.trim().toLowerCase()
  return lower === 'lawyer' || lower === 'lawer'
}

/**
 * Kiểm tra xem đối tượng người dùng có vai trò Luật sư hay không
 */
export function isLawyerUser(user?: { role?: string | null } | null): boolean {
  return isLawyerRole(user?.role)
}

/**
 * Xác định xem tin nhắn hoặc phiên tư vấn có thuộc chế độ Multi-Agent hay không
 */
export function isMultiAgentWorkflow(
  message?: ConversationMessage | null,
  user?: { role?: string | null } | null,
): boolean {
  if (message?.workflowMode === 'multi_agent') return true
  if (
    message?.content &&
    (message.content.includes('[Đa Agent') ||
      message.content.includes('Hệ thống đã tổng hợp ý kiến từ nhiều chuyên gia'))
  ) {
    return true
  }
  return isLawyerUser(user)
}
