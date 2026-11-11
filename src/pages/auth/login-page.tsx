import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Scale, Sparkles } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm, RegisterForm } from '@/features/auth'

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  const locationState = location.state as
    { initialEmail?: string; infoMessage?: string } | undefined

  const [prefilledEmail, setPrefilledEmail] = useState<string>(
    searchParams.get('email') || locationState?.initialEmail || '',
  )
  const [infoMessage, setInfoMessage] = useState<string | null>(
    locationState?.infoMessage || null,
  )

  const defaultTab = searchParams.get('tab') === 'register' ? 'register' : 'login'

  const handleTabChange = (val: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', val)
        return next
      },
      { replace: true },
    )
  }

  const handleVerifiedNeedsLogin = (email: string) => {
    setPrefilledEmail(email)
    setInfoMessage(
      'Tài khoản của bạn đã được kích hoạt thành công! Vui lòng đăng nhập bằng mật khẩu vừa đăng ký.',
    )
    handleTabChange('login')
  }

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      {/* Background Subtle Gradient */}
      <div className="from-primary/10 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr via-purple-500/10 to-transparent blur-3xl" />

      <Card className="border-border/80 bg-card/80 w-full max-w-md shadow-lg backdrop-blur-md">
        <CardHeader className="pb-4 text-center">
          <Link to="/" className="mx-auto mb-2 inline-flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-xs">
              <Scale className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Tillegal</span>
          </Link>
          <CardTitle className="text-xl font-bold">
            Trợ lý AI Pháp luật Việt Nam
          </CardTitle>
          <CardDescription className="text-xs">
            Đăng nhập để tra cứu, hỏi đáp và quản lý lịch sử tư vấn pháp lý
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={defaultTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="register">Đăng ký mới</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm
                initialEmail={prefilledEmail}
                initialMessage={infoMessage || undefined}
              />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm onVerifiedButNeedsLogin={handleVerifiedNeedsLogin} />
            </TabsContent>
          </Tabs>

          <div className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-[11px]">
            <Sparkles className="text-primary size-3" />
            <span>Phân quyền chuyên sâu cho Người dân & Luật sư</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
