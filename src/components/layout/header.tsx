import { Link, useLocation } from 'react-router-dom'
import { LogOut, MessageSquare, Scale, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth'
import { ThemeToggle } from './theme-toggle'

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: Scale },
    { to: '/chat', label: t('nav.chat'), icon: MessageSquare },
    { to: '/verify', label: t('nav.verify'), icon: ShieldCheck },
  ]

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'TL'

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-xs">
            <Scale className="size-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight">Tillegal</span>
              <Badge
                variant="outline"
                className="border-primary/30 text-primary hidden px-1.5 py-0 text-[10px] sm:inline-flex"
              >
                {t('app.badge')}
              </Badge>
            </div>
            <span className="text-muted-foreground hidden text-[10px] leading-none sm:block">
              {t('app.subtitle')}
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <Link key={to} to={to}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={
                    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }
                >
                  <Icon className="mr-1 size-4" />
                  {label}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hover:ring-primary/40 focus-visible:ring-ring flex items-center gap-2 rounded-full p-0.5 outline-hidden transition-all hover:ring-2 focus-visible:ring-2"
                >
                  <Avatar
                    size="sm"
                    className="bg-primary/10 text-primary text-xs font-semibold"
                  >
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm leading-none font-semibold">
                        {user.fullName}
                      </p>
                      <Badge
                        variant={
                          user.role?.toLowerCase() === 'lawyer' ? 'default' : 'secondary'
                        }
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {user.role?.toLowerCase() === 'lawyer'
                          ? 'Luật sư'
                          : user.role?.toLowerCase() === 'admin'
                            ? 'Admin'
                            : 'Người dân'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs leading-none">
                      {user.email}
                    </p>
                    {user.phoneNumber && (
                      <p className="text-muted-foreground pt-1 text-[10px]">
                        SĐT:{' '}
                        <span className="text-foreground font-medium">
                          {user.phoneNumber}
                        </span>
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void logout()}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/login?tab=register">
                <Button size="sm" className="font-medium shadow-xs">
                  {t('nav.startNow')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
