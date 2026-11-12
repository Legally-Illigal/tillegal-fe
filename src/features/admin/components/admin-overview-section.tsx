import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquareHeart,
  RefreshCw,
  RotateCcw,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminEvaluations,
  type HelpfulFilter,
  type RatingFilter,
  type RoleFilter,
} from '../hooks/use-admin-evaluations'
import {
  formatAdminDateTime,
  getRoleBadgeVariant,
  getRoleDisplayLabel,
} from '../utils/admin-formatters'
import { AdminEvaluationDetailDialog } from './admin-evaluation-detail-dialog'

interface AdminOverviewSectionProps {
  onNavigateToUsers?: () => void
}

const RATING_LEVELS = [5, 4, 3, 2, 1] as const

export function AdminOverviewSection({ onNavigateToUsers }: AdminOverviewSectionProps) {
  const {
    summary,
    totalUsersCount,
    evaluations,
    totalCount,
    pageNumber,
    totalPages,
    helpfulFilter,
    roleFilter,
    ratingFilter,
    setHelpfulFilter,
    setRoleFilter,
    setRatingFilter,
    setPageNumber,
    resetFilters,
    isSummaryLoading,
    isListLoading,
    summaryError,
    listError,
    selectedEvaluation,
    isDetailOpen,
    isDetailLoading,
    setIsDetailOpen,
    refresh,
    openEvaluationDetail,
  } = useAdminEvaluations()

  const totalRated = summary
    ? RATING_LEVELS.reduce(
        (acc, level) => acc + (summary.ratingDistribution?.[String(level)] ?? 0),
        0,
      )
    : 0

  const helpfulTotal = summary ? summary.helpfulCount + summary.unhelpfulCount : 0
  const helpfulRate =
    helpfulTotal > 0 && summary
      ? Math.round((summary.helpfulCount / helpfulTotal) * 100)
      : 0

  const hasActiveFilters =
    helpfulFilter !== 'all' || roleFilter !== 'all' || ratingFilter !== 'all'

  return (
    <div className="space-y-6">
      {summaryError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{summaryError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Tổng tài khoản</span>
              <Users className="text-muted-foreground size-4" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isSummaryLoading && totalUsersCount === null ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                (totalUsersCount ?? '—')
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {onNavigateToUsers ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={onNavigateToUsers}
              >
                Quản lý người dùng &rarr;
              </Button>
            ) : (
              <p className="text-muted-foreground text-xs">
                Người dân, Luật sư &amp; Admin
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Tổng đánh giá AI</span>
              <MessageSquareHeart className="text-muted-foreground size-4" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                (summary?.totalEvaluations ?? 0)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Luật sư:{' '}
              <span className="font-medium">{summary?.lawyerEvaluationsCount ?? 0}</span>
              {' • '}
              Người dân:{' '}
              <span className="font-medium">{summary?.userEvaluationsCount ?? 0}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Tỷ lệ hữu ích</span>
              <ThumbsUp className="text-muted-foreground size-4" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isSummaryLoading ? <Skeleton className="h-8 w-20" /> : `${helpfulRate}%`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {summary?.helpfulCount ?? 0} hữu ích / {summary?.unhelpfulCount ?? 0} chưa
              hữu ích
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Điểm trung bình</span>
              <Star className="size-4 fill-amber-400 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold">
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                `${(summary?.averageRating ?? 0).toFixed(1)} / 5.0`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Tính trên {totalRated} lượt chấm điểm sao
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution & Role Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Phân bổ mức đánh giá sao</CardTitle>
            <CardDescription>
              Thống kê chất lượng phản hồi AI từ 1 đến 5 sao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSummaryLoading ? (
              <div className="space-y-3">
                {RATING_LEVELS.map((level) => (
                  <Skeleton key={level} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              RATING_LEVELS.map((level) => {
                const count = summary?.ratingDistribution?.[String(level)] ?? 0
                const percent =
                  totalRated > 0 ? Math.round((count / totalRated) * 100) : 0
                return (
                  <div key={level} className="flex items-center gap-3 text-sm">
                    <div className="flex w-16 shrink-0 items-center gap-1 font-medium">
                      <span>{level}</span>
                      <Star className="size-3.5 fill-amber-400 text-amber-500" />
                    </div>
                    <Progress value={percent} className="h-2 flex-1" />
                    <div className="text-muted-foreground w-24 shrink-0 text-right text-xs">
                      {count} lượt ({percent}%)
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cơ cấu phản hồi</CardTitle>
            <CardDescription>
              Tỷ trọng đánh giá theo vai trò và mức độ hữu ích.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Đánh giá từ Luật sư</span>
                <span className="font-semibold">
                  {summary?.lawyerEvaluationsCount ?? 0}
                </span>
              </div>
              <Progress
                value={
                  summary && summary.totalEvaluations > 0
                    ? Math.round(
                        (summary.lawyerEvaluationsCount / summary.totalEvaluations) * 100,
                      )
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Đánh giá từ Người dân</span>
                <span className="font-semibold">
                  {summary?.userEvaluationsCount ?? 0}
                </span>
              </div>
              <Progress
                value={
                  summary && summary.totalEvaluations > 0
                    ? Math.round(
                        (summary.userEvaluationsCount / summary.totalEvaluations) * 100,
                      )
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-lg border p-3 text-center">
              <div>
                <p className="text-muted-foreground text-[11px]">Hữu ích</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {summary?.helpfulCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px]">Chưa hữu ích</p>
                <p className="text-destructive text-base font-bold">
                  {summary?.unhelpfulCount ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations List Table */}
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Nhật ký đánh giá AI gần đây</CardTitle>
            <CardDescription>
              Theo dõi phản hồi chi tiết của người dùng để cải thiện câu trả lời và trích
              dẫn pháp lý.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={isListLoading || isSummaryLoading}
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${isListLoading ? 'animate-spin' : ''}`}
            />
            Làm mới
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={helpfulFilter}
              onValueChange={(value) => setHelpfulFilter(value as HelpfulFilter)}
            >
              <SelectTrigger aria-label="Lọc theo độ hữu ích" className="w-44">
                <SelectValue placeholder="Độ hữu ích" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="helpful">Hữu ích</SelectItem>
                <SelectItem value="unhelpful">Chưa hữu ích</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={ratingFilter}
              onValueChange={(value) => setRatingFilter(value as RatingFilter)}
            >
              <SelectTrigger aria-label="Lọc theo số sao" className="w-40">
                <SelectValue placeholder="Số sao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả số sao</SelectItem>
                <SelectItem value="5">5 sao</SelectItem>
                <SelectItem value="4">4 sao</SelectItem>
                <SelectItem value="3">3 sao</SelectItem>
                <SelectItem value="2">2 sao</SelectItem>
                <SelectItem value="1">1 sao</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <SelectTrigger aria-label="Lọc theo vai trò" className="w-44">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="Lawyer">Luật sư</SelectItem>
                <SelectItem value="User">Người dân</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="mr-1.5 size-3.5" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          {listError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Số sao</TableHead>
                  <TableHead>Nhận xét</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isListLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : evaluations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground h-24 text-center"
                    >
                      Chưa có đánh giá AI nào phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                ) : (
                  evaluations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(item.evaluatorRole)}>
                          {getRoleDisplayLabel(item.evaluatorRole)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.isHelpful === true ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <ThumbsUp className="size-3.5" />
                            Hữu ích
                          </span>
                        ) : item.isHelpful === false ? (
                          <span className="text-destructive inline-flex items-center gap-1 text-xs font-medium">
                            <ThumbsDown className="size-3.5" />
                            Chưa hữu ích
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.rating !== null ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium">
                            <Star className="size-3.5 fill-amber-400 text-amber-500" />
                            {item.rating}/5
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate whitespace-normal">
                        <span className="line-clamp-2 text-xs">
                          {item.feedbackComment?.trim() || 'Không có nhận xét'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatAdminDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void openEvaluationDetail(item)}
                        >
                          <Eye className="mr-1 size-3.5" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">
              Tổng số <span className="text-foreground font-medium">{totalCount}</span>{' '}
              đánh giá • Trang{' '}
              <span className="text-foreground font-medium">{pageNumber}</span> /{' '}
              {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1 || isListLoading}
                onClick={() => setPageNumber(pageNumber - 1)}
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pageNumber >= totalPages || isListLoading}
                onClick={() => setPageNumber(pageNumber + 1)}
              >
                Sau
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdminEvaluationDetailDialog
        evaluation={selectedEvaluation}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        isLoading={isDetailLoading}
      />
    </div>
  )
}
