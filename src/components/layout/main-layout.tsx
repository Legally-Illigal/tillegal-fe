import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './header'
import { Footer } from './footer'

export function MainLayout() {
  const location = useLocation()
  const isChat = location.pathname.startsWith('/chat')

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary flex min-h-screen flex-col antialiased">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
      {!isChat && <Footer />}
    </div>
  )
}
