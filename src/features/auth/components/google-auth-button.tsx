import { useState, useEffect, useRef, useCallback } from 'react'
import { AlertCircle, ExternalLink, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { env } from '@/config/env'
import { useAuth } from '../hooks/use-auth'
import { formatAuthError } from '../utils/auth-error-helper'
import { toast } from 'sonner'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (momentListener?: (notification: unknown) => void) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon'
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
              logo_alignment?: 'left' | 'center'
              width?: number | string
              locale?: string
            },
          ) => void
        }
      }
    }
  }
}

interface GoogleAuthButtonProps {
  mode?: 'login' | 'register'
  onSuccess?: () => void
  disabled?: boolean
}

export function GoogleAuthButton({
  mode = 'login',
  onSuccess,
  disabled = false,
}: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [manualTokenError, setManualTokenError] = useState<string | null>(null)
  const [isTestingToken, setIsTestingToken] = useState(false)

  const googleContainerRef = useRef<HTMLDivElement>(null)
  const isGoogleConfigured = Boolean(
    env.googleClientId &&
    env.googleClientId.trim() !== '' &&
    !env.googleClientId.includes('your-google-oauth-client-id'),
  )

  const handleCredentialResponse = useCallback(
    async (idToken: string) => {
      setIsLoading(true)
      try {
        await loginWithGoogle(idToken)
        toast.success(
          mode === 'register'
            ? 'Đăng ký & đăng nhập bằng Google thành công!'
            : 'Đăng nhập bằng Google thành công!',
        )
        onSuccess?.()
      } catch (err) {
        const formatted = formatAuthError(
          err,
          'Đăng nhập Google không thành công. Vui lòng thử lại.',
        )
        toast.error(formatted)
      } finally {
        setIsLoading(false)
      }
    },
    [loginWithGoogle, mode, onSuccess],
  )

  // Load and initialize Google Identity Services script when configured
  useEffect(() => {
    if (!isGoogleConfigured) return

    const initGsi = () => {
      try {
        window.google?.accounts?.id?.initialize({
          client_id: env.googleClientId,
          callback: (response) => {
            if (response.credential) {
              void handleCredentialResponse(response.credential)
            } else {
              toast.error('Không nhận được token xác thực từ Google.')
            }
          },
        })

        if (googleContainerRef.current) {
          googleContainerRef.current.innerHTML = ''
          window.google?.accounts?.id?.renderButton(googleContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 384,
            locale: 'vi',
          })
        }
      } catch (err) {
        console.error('Lỗi khởi tạo Google Identity Services:', err)
      }
    }

    if (!window.google?.accounts?.id) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGsi
      document.body.appendChild(script)
    } else {
      initGsi()
    }
  }, [isGoogleConfigured, mode, handleCredentialResponse])

  const handleClickFallbackButton = () => {
    if (!isGoogleConfigured) {
      setShowConfigDialog(true)
      return
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    }
  }

  const handleTestManualToken = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualTokenError(null)

    if (!manualToken.trim()) {
      setManualTokenError('Vui lòng dán Google ID Token để thử nghiệm.')
      return
    }

    setIsTestingToken(true)
    try {
      await loginWithGoogle(manualToken.trim())
      toast.success('Đăng nhập Google thành công!')
      setShowConfigDialog(false)
      onSuccess?.()
    } catch (err) {
      setManualTokenError(
        formatAuthError(
          err,
          'Backend từ chối token: Token không hợp lệ hoặc không khớp với ClientId.',
        ),
      )
    } finally {
      setIsTestingToken(false)
    }
  }

  const label = mode === 'register' ? 'Đăng ký bằng Google' : 'Đăng nhập với Google'

  return (
    <>
      {/* If Google is configured, show the native Google button iframe container */}
      {isGoogleConfigured ? (
        <div className="flex w-full justify-center">
          <div ref={googleContainerRef} className="flex w-full justify-center" />
        </div>
      ) : (
        /* Fallback button when Client ID is not configured yet */
        <Button
          type="button"
          variant="outline"
          onClick={handleClickFallbackButton}
          disabled={disabled || isLoading}
          className="border-border/80 bg-background/50 hover:bg-muted/60 w-full gap-2 font-medium"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="text-xs">{label}</span>
        </Button>
      )}

      {/* Helpful Configuration & Testing Modal */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="bg-primary/10 text-primary mb-1 flex size-9 items-center justify-center rounded-lg">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold">
              Cấu hình Đăng nhập Google (OAuth 2.0)
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              API phía Backend (<code>/api/auth/login/google</code>) đã sẵn sàng và tự
              động tạo tài khoản hoặc đăng nhập trực tiếp. Tuy nhiên phía Frontend cần mã{' '}
              <strong>Google Client ID</strong> để trình duyệt mở được hộp thoại xác thực
              của Google.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-3">
              <p className="text-foreground font-semibold">3 bước kích hoạt nhanh:</p>
              <ol className="text-muted-foreground list-decimal space-y-1 pl-4">
                <li>
                  Vào{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary inline-flex items-center gap-0.5 font-medium underline"
                  >
                    Google Cloud Console <ExternalLink className="size-3" />
                  </a>
                  , tạo <strong>OAuth Client ID</strong> (loại Web Application).
                </li>
                <li>
                  Thêm <code>http://localhost:5173</code> vào{' '}
                  <em>Authorized JavaScript Origins</em>.
                </li>
                <li>
                  Thêm Client ID vào file <code>.env</code> ở frontend:
                  <div className="bg-background text-foreground mt-1 rounded border p-1.5 font-mono text-[11px]">
                    VITE_GOOGLE_CLIENT_ID=&quot;your-id.apps.googleusercontent.com&quot;
                  </div>
                  và đồng bộ vào <code>appsettings.Development.json</code> ở backend.
                </li>
              </ol>
            </div>

            <form onSubmit={handleTestManualToken} className="space-y-2 border-t pt-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="manual-token" className="text-xs font-semibold">
                  Kiểm thử trực tiếp API Backend với Google ID Token
                </Label>
              </div>

              {manualTokenError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="size-3.5" />
                  <AlertDescription className="text-xs">
                    {manualTokenError}
                  </AlertDescription>
                </Alert>
              )}

              <Input
                id="manual-token"
                placeholder="Dán chuỗi Google idToken (eyJhbGciOi...) tại đây"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="font-mono text-xs"
                disabled={isTestingToken}
              />

              <Button
                type="submit"
                size="sm"
                className="w-full text-xs font-medium"
                disabled={isTestingToken || !manualToken.trim()}
              >
                {isTestingToken ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Đang gửi xác thực tới Backend...
                  </>
                ) : (
                  'Gửi Token kiểm thử Đăng nhập Google'
                )}
              </Button>
            </form>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfigDialog(false)}
              className="text-xs"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
