/**
 * Định dạng ngày giờ theo chuẩn tiếng Việt (dd/MM/yyyy HH:mm)
 */
export function formatUserDateTime(value: string | null | undefined): string {
  if (!value) return 'Chưa ghi nhận'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Không xác định'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Chuyển đổi mã vai trò sang nhãn tiếng Việt
 */
export function getUserRoleLabel(role: string | null | undefined): string {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'Quản trị viên'
    case 'lawyer':
      return 'Luật sư'
    case 'user':
    case 'citizen':
      return 'Người dân'
    default:
      return role?.trim() || 'Người dân'
  }
}
