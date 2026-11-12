import { Navigate, createBrowserRouter } from 'react-router-dom'
import { MainLayout, RouteErrorBoundary } from '@/components/layout'
import { ProtectedRoute } from '@/features/auth'
import { HomePage } from '@/pages/home/home-page'
import { LoginPage } from '@/pages/auth/login-page'
import { ChatPage } from '@/pages/chat/chat-page'
import { AdminPage } from '@/pages/admin/admin-page'
import { NotFoundPage } from '@/pages/not-found/not-found-page'

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/chat',
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/verify',
        element: <Navigate to="/chat" replace />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
