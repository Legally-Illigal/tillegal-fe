import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function RouteErrorBoundary() {
  const error = useRouteError()

  let errorMessage = 'Đã xảy ra lỗi không mong muốn trong ứng dụng.'
  let statusText = 'Lỗi hệ thống'

  if (isRouteErrorResponse(error)) {
    statusText = `Lỗi ${error.status}: ${error.statusText}`
    errorMessage = error.data?.message || error.statusText || errorMessage
  } else if (error instanceof Error) {
    errorMessage = error.message
  }

  return (
    <div className="bg-background flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="bg-destructive/10 text-destructive mb-4 flex size-14 items-center justify-center rounded-2xl shadow-xs">
        <AlertTriangle className="size-7" />
      </div>

      <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
        {statusText}
      </h1>

      <p className="text-muted-foreground mt-2 max-w-md text-xs sm:text-sm">
        {errorMessage}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-2 text-xs"
        >
          <RefreshCw className="size-3.5" />
          <span>Tải lại trang</span>
        </Button>

        <Link to="/">
          <Button className="gap-2 text-xs">
            <Home className="size-3.5" />
            <span>Về trang chủ</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
