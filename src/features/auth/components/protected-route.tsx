import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import type { UserRole } from '../types/auth.types'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-3 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (
    allowedRoles &&
    (!user.role ||
      !allowedRoles.some((role) => role.toLowerCase() === user.role?.toLowerCase()))
  ) {
    return (
      <div className="container mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl font-bold">Không đủ quyền truy cập</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Chức năng này yêu cầu vai trò quyền hạn cao hơn.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
