import * as React from 'react'
import { toast } from 'sonner'
import { adminApi } from '../api/admin-api'
import type { AdminUser } from '../types/admin.types'

const DEFAULT_PAGE_SIZE = 10

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message
  }
  return fallback
}

export interface UseAdminUsersReturn {
  users: AdminUser[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  searchTerm: string
  setSearchTerm: (value: string) => void
  setPageNumber: (page: number) => void
  isLoading: boolean
  error: string | null
  mutatingUserId: string | null
  selectedUser: AdminUser | null
  isDetailOpen: boolean
  isDetailLoading: boolean
  setIsDetailOpen: (open: boolean) => void
  refresh: () => Promise<void>
  openUserDetail: (user: AdminUser) => Promise<void>
  toggleUserStatus: (user: AdminUser) => Promise<boolean>
  grantLawyerRole: (user: AdminUser) => Promise<boolean>
}

export function useAdminUsers(initialPageSize = DEFAULT_PAGE_SIZE): UseAdminUsersReturn {
  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageNumber, setPageNumber] = React.useState(1)
  const [pageSize] = React.useState(initialPageSize)
  const [totalPages, setTotalPages] = React.useState(1)
  const [searchTerm, setSearchTermState] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')

  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [mutatingUserId, setMutatingUserId] = React.useState<string | null>(null)

  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isDetailLoading, setIsDetailLoading] = React.useState(false)

  // Debounce search input so typing doesn't spam requests
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  const setSearchTerm = React.useCallback((value: string) => {
    setSearchTermState(value)
    setPageNumber(1)
  }, [])

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await adminApi.getUsers({
        pageNumber,
        pageSize,
        searchTerm: debouncedSearch,
      })
      setUsers(Array.isArray(response.items) ? response.items : [])
      setTotalCount(response.totalCount ?? 0)
      setTotalPages(Math.max(1, response.totalPages ?? 1))
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể tải danh sách người dùng.'))
    } finally {
      setIsLoading(false)
    }
  }, [pageNumber, pageSize, debouncedSearch])

  React.useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const openUserDetail = React.useCallback(async (user: AdminUser) => {
    setSelectedUser(user)
    setIsDetailOpen(true)
    setIsDetailLoading(true)
    try {
      const detail = await adminApi.getUserById(user.id)
      setSelectedUser(detail)
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Không thể tải chi tiết người dùng.'))
    } finally {
      setIsDetailLoading(false)
    }
  }, [])

  const syncUpdatedUser = React.useCallback((updated: AdminUser) => {
    setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    setSelectedUser((prev) => (prev?.id === updated.id ? updated : prev))
  }, [])

  const toggleUserStatus = React.useCallback(
    async (user: AdminUser): Promise<boolean> => {
      const nextStatus = !user.isActive
      setMutatingUserId(user.id)
      try {
        const updated = await adminApi.updateUserStatus(user.id, {
          isActive: nextStatus,
        })
        syncUpdatedUser(updated)
        toast.success(
          nextStatus
            ? `Đã mở khóa tài khoản ${updated.email || updated.fullName || ''}`.trim()
            : `Đã khóa tài khoản ${updated.email || updated.fullName || ''}`.trim(),
        )
        return true
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Không thể cập nhật trạng thái tài khoản.'))
        return false
      } finally {
        setMutatingUserId(null)
      }
    },
    [syncUpdatedUser],
  )

  const grantLawyerRole = React.useCallback(
    async (user: AdminUser): Promise<boolean> => {
      setMutatingUserId(user.id)
      try {
        const updated = await adminApi.grantLawyer(user.id)
        syncUpdatedUser(updated)
        toast.success(
          `Đã cấp quyền Luật sư cho ${updated.fullName || updated.email || 'người dùng'}.`,
        )
        return true
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Không thể cấp quyền Luật sư.'))
        return false
      } finally {
        setMutatingUserId(null)
      }
    },
    [syncUpdatedUser],
  )

  return {
    users,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    searchTerm,
    setSearchTerm,
    setPageNumber,
    isLoading,
    error,
    mutatingUserId,
    selectedUser,
    isDetailOpen,
    isDetailLoading,
    setIsDetailOpen,
    refresh: fetchUsers,
    openUserDetail,
    toggleUserStatus,
    grantLawyerRole,
  }
}
