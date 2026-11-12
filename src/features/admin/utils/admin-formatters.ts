/**
 * Định dạng ngày giờ theo chuẩn Việt Nam (dd/MM/yyyy HH:mm)
 */
export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return 'Chưa có'
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
 * Chuyển đổi mã vai trò sang nhãn hiển thị tiếng Việt
 */
export function getRoleDisplayLabel(role: string | null | undefined): string {
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

/**
 * Chuẩn hóa biến thể hiển thị Badge theo vai trò
 */
export function getRoleBadgeVariant(
  role: string | null | undefined,
): 'default' | 'secondary' | 'outline' {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'default'
    case 'lawyer':
      return 'secondary'
    default:
      return 'outline'
  }
}

/**
 * Rút gọn tên thành 2 ký tự đại diện cho Avatar
 */
export function getUserInitials(
  fullName: string | null | undefined,
  email?: string | null,
): string {
  const name = fullName?.trim()
  if (name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(-2)
      .join('')
      .toUpperCase()
  }
  const mail = email?.trim()
  if (mail) {
    return mail.slice(0, 2).toUpperCase()
  }
  return 'ND'
}
