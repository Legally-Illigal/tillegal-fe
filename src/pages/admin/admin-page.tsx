import { useSearchParams } from 'react-router-dom'
import { BarChart3, ShieldCheck, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminOverviewSection, AdminUsersSection } from '@/features/admin'
import { useAuth } from '@/features/auth'

type AdminTab = 'overview' | 'users'

export function AdminPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab: AdminTab = searchParams.get('tab') === 'users' ? 'users' : 'overview'

  const handleTabChange = (nextTab: string) => {
    const tabValue: AdminTab = nextTab === 'users' ? 'users' : 'overview'
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', tabValue)
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Quản trị hệ thống Tillegal
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Theo dõi thống kê chất lượng AI và quản lý tài khoản người dùng, phân
                quyền Luật sư.
              </p>
            </div>
          </div>
        </div>

        {user && (
          <Badge variant="outline" className="w-fit gap-1.5 px-2.5 py-1 text-xs">
            <ShieldCheck className="text-primary size-3.5" />
            <span>Quản trị viên: {user.fullName || user.email}</span>
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="size-4" />
            <span>Tổng quan &amp; Đánh giá AI</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="size-4" />
            <span>Quản lý người dùng</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <AdminOverviewSection onNavigateToUsers={() => handleTabChange('users')} />
        </TabsContent>

        <TabsContent value="users" className="mt-0">
          <AdminUsersSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
