import { AlertCircle, FileCheck2, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  useVerification,
  VerificationForm,
  VerificationHistoryList,
  VerificationResultCard,
  VerificationSampleSelector,
} from '@/features/citation'

export function VerifyPage() {
  const {
    request,
    result,
    isLoading,
    error,
    history,
    verify,
    loadSample,
    selectHistoryItem,
    deleteHistoryItem,
    clearHistory,
  } = useVerification()

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden pb-16">
      {/* Background Glow Accents */}
      <div className="from-primary/10 via-brand-500/10 pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr to-transparent blur-3xl" />

      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Page Hero Header */}
        <div className="border-border/60 mb-8 border-b pb-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
          <div>
            <div className="border-primary/20 bg-primary/5 text-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs">
              <ShieldCheck className="size-3.5" />
              <span>Phân hệ Thẩm định Độc lập</span>
            </div>
            <h1 className="text-foreground mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Kiểm Chứng Căn Cứ & Luận Điểm Pháp Lý
            </h1>
            <p className="text-muted-foreground mt-1.5 max-w-2xl text-xs leading-relaxed sm:text-sm">
              Đối chiếu nhận định với hệ thống văn bản quy phạm pháp luật Việt Nam hiện
              hành, phát hiện rủi ro căn cứ sai lệch hoặc văn bản đã hết hiệu lực.
            </p>
          </div>

          <div className="text-muted-foreground hidden items-center gap-4 text-xs lg:flex">
            <div className="flex items-center gap-1.5">
              <Scale className="text-primary size-4" />
              <span>Đối chiếu điều khoản gốc</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-amber-500" />
              <span>Chấm điểm độ tin cậy</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Two-Column Grid */}
        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* Left Column: Form & Sample Presets (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <Card className="border-border/80 bg-card/90 shadow-sm backdrop-blur-xs">
              <CardHeader className="border-border/50 border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                    <FileCheck2 className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">
                      Nhập Dữ Liệu Thẩm Định
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      Nhập nhận định pháp luật hoặc luận điểm cần kiểm tra tính chính xác
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <VerificationForm
                  onSubmit={verify}
                  isLoading={isLoading}
                  initialData={request}
                />
              </CardContent>
            </Card>

            {/* Quick Sample Selector */}
            <div className="border-border/80 bg-muted/30 rounded-2xl border p-4">
              <VerificationSampleSelector onSelect={loadSample} disabled={isLoading} />
            </div>

            {/* History List on desktop when space allows */}
            <div className="hidden lg:block">
              <VerificationHistoryList
                history={history}
                activeId={result?.id}
                onSelect={selectHistoryItem}
                onDelete={deleteHistoryItem}
                onClear={clearHistory}
              />
            </div>
          </div>

          {/* Right Column: Verification Results (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {result ? (
              <VerificationResultCard result={result} />
            ) : (
              <Card className="border-border/80 bg-card/40 border-2 border-dashed p-8 text-center sm:p-12">
                <div className="bg-primary/10 border-primary/20 mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border shadow-xs">
                  <ShieldCheck className="text-primary size-7" />
                </div>
                <h3 className="text-foreground text-base font-bold sm:text-lg">
                  Chưa có kết quả thẩm định
                </h3>
                <p className="text-muted-foreground mx-auto mt-2 max-w-md text-xs leading-relaxed">
                  Nhập nhận định ở biểu mẫu bên trái hoặc bấm vào một tình huống mẫu để
                  bắt đầu quy trình đối chiếu văn bản quy phạm pháp luật.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className="px-2.5 py-1 text-[11px] font-normal"
                  >
                    1. Nhập nhận định / căn cứ
                  </Badge>
                  <span className="text-muted-foreground self-center">→</span>
                  <Badge
                    variant="outline"
                    className="px-2.5 py-1 text-[11px] font-normal"
                  >
                    2. AI đối chiếu kho luật số hóa
                  </Badge>
                  <span className="text-muted-foreground self-center">→</span>
                  <Badge
                    variant="outline"
                    className="px-2.5 py-1 text-[11px] font-normal"
                  >
                    3. Báo cáo thẩm định & rủi ro
                  </Badge>
                </div>
              </Card>
            )}

            {/* History List on mobile/tablet */}
            <div className="block lg:hidden">
              <VerificationHistoryList
                history={history}
                activeId={result?.id}
                onSelect={selectHistoryItem}
                onDelete={deleteHistoryItem}
                onClear={clearHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
