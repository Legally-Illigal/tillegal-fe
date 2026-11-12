import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from '@/features/auth'
import { apiClient } from '@/lib/api/client'
import { adminApi } from './api/admin-api'
import { AdminOverviewSection } from './components/admin-overview-section'
import { AdminUsersSection } from './components/admin-users-section'
import type {
  AdminUser,
  AiEvaluation,
  AiEvaluationSummary,
  PagedAdminUsersResponse,
  PagedAiEvaluationsResponse,
} from './types/admin.types'
import { AdminPage } from '@/pages/admin/admin-page'

vi.mock('@/lib/api/client', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client')
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const mockAdminProfile = {
  id: 'admin-1',
  email: 'admin@tillegal.vn',
  fullName: 'Quản Trị Viên',
  role: 'Admin',
}

const mockAdminUser: AdminUser = {
  id: 'admin-1',
  fullName: 'Quản Trị Viên',
  email: 'admin@tillegal.vn',
  phoneNumber: '0900000001',
  roleName: 'Admin',
  isActive: true,
  createdAt: '2026-01-01T08:00:00Z',
  lastActiveAt: '2026-11-10T10:00:00Z',
}

const mockCitizenUser: AdminUser = {
  id: 'user-2',
  fullName: 'Nguyễn Văn Dân',
  email: 'dan@example.com',
  phoneNumber: '0912345678',
  roleName: 'User',
  isActive: true,
  createdAt: '2026-02-15T09:00:00Z',
  lastActiveAt: null,
}

const mockLawyerUser: AdminUser = {
  id: 'lawyer-3',
  fullName: 'Trần Thị Luật',
  email: 'luat@example.com',
  phoneNumber: null,
  roleName: 'Lawyer',
  isActive: false,
  createdAt: '2026-03-20T09:00:00Z',
  lastActiveAt: '2026-10-01T12:30:00Z',
}

const mockUsersPage: PagedAdminUsersResponse = {
  items: [mockAdminUser, mockCitizenUser, mockLawyerUser],
  totalCount: 3,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
}

const mockSummary: AiEvaluationSummary = {
  totalEvaluations: 20,
  helpfulCount: 16,
  unhelpfulCount: 4,
  averageRating: 4.3,
  lawyerEvaluationsCount: 8,
  userEvaluationsCount: 12,
  ratingDistribution: {
    '5': 10,
    '4': 6,
    '3': 2,
    '2': 1,
    '1': 1,
  },
}

const mockEvaluationsPage: PagedAiEvaluationsResponse = {
  items: [
    {
      id: 'eval-1',
      messageId: 'msg-101',
      evaluatorUserId: 'lawyer-3',
      evaluatorRole: 'Lawyer',
      isHelpful: true,
      rating: 5,
      feedbackComment: 'Trích dẫn Điều 45 Luật Đất đai 2024 rất chính xác.',
      createdAt: '2026-11-11T14:20:00Z',
      updatedAt: null,
    },
    {
      id: 'eval-2',
      messageId: 'msg-102',
      evaluatorUserId: 'user-2',
      evaluatorRole: 'User',
      isHelpful: false,
      rating: 2,
      feedbackComment: 'Cần giải thích ngắn gọn hơn.',
      createdAt: '2026-11-11T15:00:00Z',
      updatedAt: null,
    },
  ],
  pageNumber: 1,
  pageSize: 10,
  totalCount: 2,
  totalPages: 1,
}

function seedLoggedInUser(user: Record<string, unknown>) {
  localStorage.setItem('tillegal_user_profile', JSON.stringify(user))
}

describe('Admin Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('adminApi contracts', () => {
    it('calls user management endpoints with expected paths and params', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockUsersPage)
      await adminApi.getUsers({ pageNumber: 1, pageSize: 10, searchTerm: '  an  ' })
      expect(apiClient.get).toHaveBeenCalledWith('/admin/users', {
        params: { pageNumber: 1, pageSize: 10, searchTerm: 'an' },
      })

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockUsersPage.items![1])
      await adminApi.getUserById('user-2')
      expect(apiClient.get).toHaveBeenCalledWith('/admin/users/user-2')

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        ...mockUsersPage.items![1],
        isActive: false,
      })
      await adminApi.updateUserStatus('user-2', { isActive: false })
      expect(apiClient.put).toHaveBeenCalledWith('/admin/users/user-2/status', {
        isActive: false,
      })

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        ...mockUsersPage.items![1],
        roleName: 'Lawyer',
      })
      await adminApi.grantLawyer('user-2')
      expect(apiClient.put).toHaveBeenCalledWith('/admin/users/user-2/grant-lawyer')
    })

    it('calls AI evaluation endpoints with expected paths and filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockSummary)
      await adminApi.getAiEvaluationsSummary()
      expect(apiClient.get).toHaveBeenCalledWith('/admin/ai-evaluations/summary')

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockEvaluationsPage)
      await adminApi.getAiEvaluations({
        pageNumber: 2,
        pageSize: 10,
        isHelpful: true,
        rating: 5,
        evaluatorRole: 'Lawyer',
      })
      expect(apiClient.get).toHaveBeenCalledWith('/admin/ai-evaluations', {
        params: {
          pageNumber: 2,
          pageSize: 10,
          isHelpful: true,
          rating: 5,
          evaluatorUserId: undefined,
          evaluatorRole: 'Lawyer',
        },
      })

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockEvaluationsPage.items![0])
      await adminApi.getAiEvaluationById('eval-1')
      expect(apiClient.get).toHaveBeenCalledWith('/admin/ai-evaluations/eval-1')
    })
  })

  describe('AdminOverviewSection', () => {
    it('renders summary metrics, rating distribution, and evaluation table', async () => {
      vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
        if (endpoint === '/admin/ai-evaluations/summary') {
          return Promise.resolve(mockSummary)
        }
        if (endpoint === '/admin/users') {
          return Promise.resolve({ ...mockUsersPage, items: [mockUsersPage.items![0]] })
        }
        if (endpoint === '/admin/ai-evaluations') {
          return Promise.resolve(mockEvaluationsPage)
        }
        if (endpoint === '/admin/ai-evaluations/eval-1') {
          return Promise.resolve(mockEvaluationsPage.items![0] as AiEvaluation)
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`))
      })

      render(<AdminOverviewSection />)

      await waitFor(() => {
        expect(screen.getByText('20')).toBeInTheDocument()
        expect(screen.getByText('80%')).toBeInTheDocument()
        expect(screen.getByText('4.3 / 5.0')).toBeInTheDocument()
        expect(
          screen.getByText('Trích dẫn Điều 45 Luật Đất đai 2024 rất chính xác.'),
        ).toBeInTheDocument()
      })

      const detailButtons = screen.getAllByRole('button', { name: /Chi tiết/i })
      const firstDetailBtn = detailButtons[0]
      expect(firstDetailBtn).toBeDefined()
      fireEvent.click(firstDetailBtn!)

      await waitFor(() => {
        expect(screen.getByText('Chi tiết đánh giá câu trả lời AI')).toBeInTheDocument()
        expect(screen.getByText('msg-101')).toBeInTheDocument()
      })
    })

    it('renders error alert and empty state when API fails or returns empty', async () => {
      vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
        if (endpoint === '/admin/ai-evaluations/summary') {
          return Promise.reject(new Error('Không có quyền truy cập thống kê'))
        }
        if (endpoint === '/admin/users') {
          return Promise.resolve({ ...mockUsersPage, totalCount: 0, items: [] })
        }
        if (endpoint === '/admin/ai-evaluations') {
          return Promise.resolve({
            items: [],
            pageNumber: 1,
            pageSize: 10,
            totalCount: 0,
            totalPages: 1,
          })
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`))
      })

      render(<AdminOverviewSection />)

      await waitFor(() => {
        expect(screen.getByText('Không có quyền truy cập thống kê')).toBeInTheDocument()
        expect(
          screen.getByText('Chưa có đánh giá AI nào phù hợp với bộ lọc hiện tại.'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('AdminUsersSection', () => {
    it('lists users, grants lawyer role, toggles lock status, and opens user detail', async () => {
      seedLoggedInUser(mockAdminProfile)

      const grantedUser: AdminUser = {
        ...mockCitizenUser,
        roleName: 'Lawyer',
      }
      const unlockedLawyer: AdminUser = {
        ...mockLawyerUser,
        isActive: true,
      }

      vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
        if (endpoint === '/admin/users') {
          return Promise.resolve(mockUsersPage)
        }
        if (endpoint === '/admin/users/user-2') {
          return Promise.resolve(mockUsersPage.items![1])
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`))
      })

      vi.mocked(apiClient.put).mockImplementation((endpoint: string) => {
        if (endpoint === '/admin/users/user-2/grant-lawyer') {
          return Promise.resolve(grantedUser)
        }
        if (endpoint === '/admin/users/lawyer-3/status') {
          return Promise.resolve(unlockedLawyer)
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`))
      })

      render(
        <AuthProvider>
          <AdminUsersSection />
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn Dân')).toBeInTheDocument()
        expect(screen.getByText('Trần Thị Luật')).toBeInTheDocument()
        expect(screen.getByText('Tổng: 3 tài khoản')).toBeInTheDocument()
      })

      // Admin cannot lock their own account (first row's lock button is disabled)
      const lockButtons = screen.getAllByRole('button', { name: /^Khóa$/i })
      expect(lockButtons[0]).toBeDisabled()

      // Grant lawyer role to user-2
      const grantButton = screen.getByRole('button', { name: /Cấp Luật sư/i })
      fireEvent.click(grantButton)

      await waitFor(() => {
        expect(screen.getByText('Xác nhận cấp quyền Luật sư')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Cấp quyền Luật sư/i }))

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith('/admin/users/user-2/grant-lawyer')
      })

      // Unlock lawyer-3
      const unlockButton = screen.getByRole('button', { name: /Mở khóa/i })
      fireEvent.click(unlockButton)

      await waitFor(() => {
        expect(screen.getByText('Xác nhận mở khóa tài khoản')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /^Mở khóa$/i }))

      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith('/admin/users/lawyer-3/status', {
          isActive: true,
        })
      })

      // Open detail for user-2
      const detailButtons = screen.getAllByRole('button', { name: /Chi tiết/i })
      const citizenDetailBtn = detailButtons[1]
      expect(citizenDetailBtn).toBeDefined()
      fireEvent.click(citizenDetailBtn!)

      await waitFor(() => {
        expect(screen.getByText('Thông tin tài khoản')).toBeInTheDocument()
        expect(apiClient.get).toHaveBeenCalledWith('/admin/users/user-2')
      })
    })
  })

  describe('Route access & AdminPage', () => {
    it('blocks non-admin users via ProtectedRoute', () => {
      seedLoggedInUser({
        id: 'u-1',
        email: 'citizen@example.com',
        fullName: 'Người Dân',
        role: 'User',
      })

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Không đủ quyền truy cập')).toBeInTheDocument()
    })

    it('renders AdminPage for Admin role and switches tabs', async () => {
      const user = userEvent.setup()
      seedLoggedInUser(mockAdminProfile)

      vi.mocked(apiClient.get).mockImplementation((endpoint: string) => {
        if (endpoint === '/admin/ai-evaluations/summary') {
          return Promise.resolve(mockSummary)
        }
        if (endpoint === '/admin/ai-evaluations') {
          return Promise.resolve(mockEvaluationsPage)
        }
        if (endpoint === '/admin/users') {
          return Promise.resolve(mockUsersPage)
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`))
      })

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Quản trị hệ thống Tillegal')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByText('Tổng đánh giá AI')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /Quản lý người dùng/i }))

      await waitFor(() => {
        expect(screen.getByText('Danh sách tài khoản hệ thống')).toBeInTheDocument()
        expect(screen.getByText('Nguyễn Văn Dân')).toBeInTheDocument()
      })
    })
  })
})
