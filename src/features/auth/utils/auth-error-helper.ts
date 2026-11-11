/**
 * Formats and translates authentication error messages from backend responses into
 * clear, user-friendly Vietnamese notifications.
 */
export function formatAuthError(error: unknown, fallbackMessage: string): string {
  if (!error) {
    return fallbackMessage
  }

  let rawMessage = ''
  if (typeof error === 'string') {
    rawMessage = error
  } else if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    rawMessage = (error as { message: string }).message
  }

  if (!rawMessage) {
    return fallbackMessage
  }

  return translateAuthMessage(rawMessage) || fallbackMessage
}

export function translateAuthMessage(message: string): string {
  const trimmed = message.trim()
  const lower = trimmed.toLowerCase()

  // Login errors
  if (lower.includes('invalid email or password')) {
    return 'Địa chỉ email hoặc mật khẩu không chính xác.'
  }

  // Registration & Email errors
  if (lower.includes('is already registered') || lower.includes('already exists')) {
    return 'Địa chỉ email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.'
  }
  if (
    lower.includes('email is required') ||
    lower.includes('valid email address is required') ||
    lower.includes('email format is invalid')
  ) {
    return 'Địa chỉ email không hợp lệ hoặc đang để trống.'
  }

  // Password errors
  if (
    lower.includes('password must be at least 8 characters') ||
    lower.includes('tối thiểu 8')
  ) {
    return 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.'
  }
  if (lower.includes('at least one uppercase letter')) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z).'
  }
  if (lower.includes('at least one lowercase letter')) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ cái thường (a-z).'
  }
  if (lower.includes('at least one number')) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ số (0-9).'
  }
  if (lower.includes('password is required')) {
    return 'Vui lòng nhập mật khẩu.'
  }

  // Full name & Phone errors
  if (lower.includes('full name is required')) {
    return 'Vui lòng nhập họ và tên.'
  }
  if (
    lower.includes('invalid phone number format') ||
    lower.includes('phone number cannot exceed')
  ) {
    return 'Số điện thoại không đúng định dạng (từ 7 đến 20 chữ số).'
  }

  // OTP Verification errors
  if (lower.includes('invalid verification code')) {
    return 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.'
  }
  if (
    lower.includes('expired') ||
    lower.includes('does not exist') ||
    lower.includes('no pending registration')
  ) {
    return 'Mã OTP đã hết hạn hoặc phiên đăng ký không tồn tại. Vui lòng bấm gửi lại mã hoặc đăng ký lại.'
  }
  if (
    lower.includes('otp code must be exactly 6 digits') ||
    lower.includes('contain only digits')
  ) {
    return 'Mã OTP phải có đúng 6 chữ số.'
  }

  // Google OAuth errors
  if (lower.includes('already associated with another google account')) {
    return 'Địa chỉ email này đã được liên kết với một tài khoản Google khác.'
  }
  if (lower.includes('google account email must be verified')) {
    return 'Tài khoản Google cần có email đã xác thực.'
  }
  if (lower.includes('no account is registered with this google account')) {
    return 'Chưa có tài khoản nào liên kết với tài khoản Google này. Vui lòng đăng ký mới.'
  }
  if (
    lower.includes('google authentication failed') ||
    lower.includes('invalid id token')
  ) {
    return 'Xác thực tài khoản Google không thành công. Vui lòng thử lại.'
  }

  return trimmed
}
